import prisma from "../lib/prisma.js";
import bus from "../lib/events.js";
import { AppError, rethrowPrismaError } from "../utils/errors.js";
import { localizeRecordItems } from "../utils/i18n.js";
import {
  validateRequiredCustomerInfo,
  buildPartialCustomerUpdate,
  sanitizeNotes,
} from "../utils/validators.js";
import { validateAndPriceItems } from "../utils/items.js";
import {
  parsePaginationQuery,
  buildCustomerSearchWhere,
} from "../utils/pagination.js";
import { matchKey, shootingListChecker } from "../utils/names.js";
import {
  resolveGuestAccount,
  resolveAccountFor,
  requesterRole,
  ownRecordsWhere,
  syncProfileGaps,
  issueSetPasswordToken,
} from "../utils/customerAccount.js";
import { sendReservationCreatedEmail } from "../lib/mail.js";
import { deliverRecord, generalDeliveryOnStatus, notifyDelivery } from "../utils/delivery.js";
import { ROLES } from "../utils/roles.js";
import {
  applyDiscount,
  createWithDiscount,
  discountAccountFor,
  refundIfUnpaid,
  syncPointsForRecord,
} from "../utils/loyalty.js";

const VALID_RESERVATION_STATUSES = ["PENDING", "CONFIRMED", "PAID", "CANCELLED", "DELIVERED"];
const RESERVATION_NOT_FOUND = { notFound: "Rezervasyon bulunamadı" };

// Tek rezervasyon kuralında sayılan durumlar (iptal edilen sayılmaz)
const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "PAID", "DELIVERED"];
// Müşterinin kendi rezervasyonunu düzenleyip silebildiği durumlar (ödeme öncesi)
const CUSTOMER_EDITABLE_STATUSES = ["PENDING", "CONFIRMED"];

// Sporcu başına tek aktif rezervasyon. Bir veli aynı hesapla kardeşler/ikizler için
// ayrı rezervasyon yapabilir; AYNI sporcu için ikinci kez yapamaz (tekrar gönderim / çift
// kayıt koruması). "Aynı sporcu" çekim listesi eşleşmesiyle aynı kuralla (matchKey)
// belirlenir. Girişli müşteri kendi hesabına, misafir formdaki e-postaya göre kontrol
// edilir — hesap açmadan ÖNCE, boşuna hesap açılmasın.
// excludeId: müşteri düzenlemesinde kaydın kendisi sayılmasın.
const assertNoActiveReservation = async (req, role, customerEmail, athleteName, excludeId) => {
  let where;
  if (role === ROLES.CUSTOMER) {
    where = await ownRecordsWhere(req.user.id);
  } else {
    const owner = await prisma.user.findUnique({
      where: { email: customerEmail },
      select: { id: true, role: true },
    });
    where = {
      OR: [
        { customerEmail },
        ...(owner?.role === ROLES.CUSTOMER ? [{ userId: owner.id }] : []),
      ],
    };
  }

  const active = await prisma.reservation.findMany({
    where: {
      AND: [
        where,
        { status: { in: ACTIVE_STATUSES } },
        ...(excludeId ? [{ id: { not: excludeId } }] : []),
      ],
    },
    select: { athleteName: true },
  });
  const key = matchKey(athleteName);
  const duplicate = active.find((r) => matchKey(r.athleteName) === key);
  if (duplicate) {
    throw new AppError(
      role === ROLES.CUSTOMER
        ? `${duplicate.athleteName} için zaten bir rezervasyonunuz var. Profilinizden düzenleyebilirsiniz.`
        : `${duplicate.athleteName} için bu e-posta ile zaten bir rezervasyon var. Giriş yapıp profilinizden düzenleyebilirsiniz.`,
      409
    );
  }
};

// Silmeden önce: ödenmemiş rezervasyonda indirim için harcanan puanı iade et
const refundOnDelete = async (id) => {
  const record = await prisma.reservation.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true, athleteName: true },
  });
  if (record) await refundIfUnpaid("reservation", record);
};

// Müşterinin kendi, hâlâ değiştirilebilir rezervasyonu (değilse 404/403)
const findOwnEditableReservation = async (req) => {
  const reservation = await prisma.reservation.findFirst({
    where: { AND: [{ id: req.params.id }, await ownRecordsWhere(req.user.id)] },
    select: { id: true, status: true, discountPercent: true },
  });
  if (!reservation) {
    throw new AppError("Rezervasyon bulunamadı", 404);
  }
  if (!CUSTOMER_EDITABLE_STATUSES.includes(reservation.status)) {
    throw new AppError(
      "Bu rezervasyon artık değiştirilemez. Değişiklik için bizimle iletişime geçin.",
      403
    );
  }
  return reservation;
};

export const getAllReservations = async (req, res) => {
  const { page, limit, skip, status, search } = parsePaginationQuery(req);
  const where = buildCustomerSearchWhere({ status, search });

  const [reservations, total, checkList] = await Promise.all([
    prisma.reservation.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.reservation.count({ where }),
    shootingListChecker(),
  ]);

  res.json({
    data: reservations.map((r) => ({
      ...r,
      ...checkList(r), // listMatch + unmatchedApparatuses (admin renklendirmesi)
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const getReservation = async (req, res) => {
  const reservation = await prisma.reservation.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });

  if (!reservation) {
    throw new AppError("Rezervasyon bulunamadı", 404);
  }

  // Paket adları istek dilinde
  const [shown] = await localizeRecordItems([reservation], req.locale);

  res.json({
    id: reservation.id,
    athleteName: reservation.athleteName,
    clubName: reservation.clubName,
    birthYear: reservation.birthYear,
    customerPhone: reservation.customerPhone,
    customerEmail: reservation.customerEmail,
    notes: reservation.notes,
    subtotal: reservation.subtotal,
    discountPercent: reservation.discountPercent,
    discountAmount: reservation.discountAmount,
    totalPrice: reservation.totalPrice,
    status: reservation.status,
    createdAt: reservation.createdAt,
    items: shown.items.map((item) => ({
      package: {
        id: item.packageId,
        name: item.packageName,
        category: item.category,
      },
      seriesCount: item.seriesCount,
      quantity: item.quantity,
      price: item.price,
      apparatuses: item.apparatuses,
      priority: item.priority,
    })),
  });
};

export const createReservation = async (req, res) => {
  if (!req.body.items || req.body.items.length === 0) {
    throw new AppError("Tüm zorunlu alanları doldurun", 400);
  }

  const customer = validateRequiredCustomerInfo(req.body);
  const { items, totalPrice: subtotal } = await validateAndPriceItems(req.body.items, {
    reservationPricing: true,
    activeOnly: true,
  });

  // Admin panelden eklerken kural yok (kardeşler vb. özel durumlar için)
  const role = await requesterRole(req);
  if (role !== ROLES.ADMIN) {
    await assertNoActiveReservation(req, role, customer.customerEmail, customer.athleteName);
  }

  // Girişli müşteriyse kendi hesabı; misafir/admin ise e-postasından hesap açılır/bulunur
  const account = await resolveAccountFor(req, customer);

  // Müşterinin profilindeki BOŞ sporcu alanlarını doldur (doluyu ezmeden),
  // böylece bir sonraki sefer form ön-dolu gelir. Beklenmez — siparişi geciktirmesin.
  if (role === ROLES.CUSTOMER) syncProfileGaps(req.user.id, customer);

  // Sadakat: seviyesi varsa indirim otomatik uygulanır ve seviyenin puanı harcanır.
  // Yüzde kayda sabitlenir (sonraki düzenlemelerde de o kullanılır).
  const reservation = await createWithDiscount({
    model: "reservation",
    discountUserId: discountAccountFor(role, req.user?.id, account.userId),
    subtotal,
    data: {
      ...customer,
      notes: sanitizeNotes(req.body.notes),
      locale: req.locale, // mailler bu dilde gider
      ...(account.userId && { userId: account.userId }),
      items: { create: items },
    },
  });

  // Admin Rezervasyonlar sayfaları yeni kaydı canlı görsün (bekleyen kayıt çekim
  // listesini etkilemez, o yüzden "shooting-list-changed" değil)
  bus.emit("records-changed");

  // Rezervasyon onay maili (fire-and-forget — token üretimi response'u bekletmesin).
  // Hesap hâlâ şifresizse şifre belirleme linki de iliştirilir; başarı ekranındaki
  // kartı atlayanlar için yedek yol.
  (async () => {
    const token =
      account.status === "claimable" ? await issueSetPasswordToken(account.userId) : null;
    sendReservationCreatedEmail(reservation.customerEmail, reservation, token);
  })().catch((err) => console.error("[mail] Rezervasyon maili hatası:", err));

  res.status(201).json({
    message: "Rezervasyon oluşturuldu",
    account: { status: account.status, email: reservation.customerEmail },
    reservation: {
      id: reservation.id,
      athleteName: reservation.athleteName,
      clubName: reservation.clubName,
      customerEmail: reservation.customerEmail,
      subtotal: reservation.subtotal,
      discountPercent: reservation.discountPercent,
      discountAmount: reservation.discountAmount,
      totalPrice: reservation.totalPrice,
      status: reservation.status,
      items: reservation.items.map((item) => ({
        package: { id: item.packageId, name: item.packageName },
        priority: item.priority,
        seriesCount: item.seriesCount,
        quantity: item.quantity,
      })),
    },
  });
};

// Girişli kullanıcının kendi rezervasyonları (düzenleme formu için tüm alanlarıyla)
export const getMyReservations = async (req, res) => {
  const reservations = await prisma.reservation.findMany({
    where: await ownRecordsWhere(req.user.id),
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  // Paket adları istek dilinde
  const localized = await localizeRecordItems(reservations, req.locale);

  res.json({
    data: localized.map((r) => ({
      id: r.id,
      athleteName: r.athleteName,
      clubName: r.clubName,
      birthYear: r.birthYear,
      customerPhone: r.customerPhone,
      customerEmail: r.customerEmail,
      notes: r.notes,
      subtotal: r.subtotal,
      discountPercent: r.discountPercent,
      discountAmount: r.discountAmount,
      totalPrice: r.totalPrice,
      status: r.status,
      deliveries: r.deliveries ?? null,
      createdAt: r.createdAt,
      items: r.items.map((item) => ({
        package: { id: item.packageId, name: item.packageName, category: item.category },
        seriesCount: item.seriesCount,
        quantity: item.quantity,
        price: item.price,
        apparatuses: item.apparatuses,
        points: item.points,
        priority: item.priority,
      })),
    })),
  });
};

// Müşteri: kendi rezervasyonunu günceller (ödeme öncesi). E-posta hesabın bağı
// olduğu için değiştirilemez; fiyatlar her zaman DB'den yeniden hesaplanır.
export const updateMyReservation = async (req, res) => {
  const { id, discountPercent } = await findOwnEditableReservation(req);
  const { customerEmail: _ignored, ...input } = req.body;
  const data = buildPartialCustomerUpdate(input);
  // Sporcu adı kardeşinkine çevrilerek aynı sporcuya ikinci kayıt açılmasın
  if (data.athleteName) {
    await assertNoActiveReservation(req, ROLES.CUSTOMER, null, data.athleteName, id);
  }
  const { items: newItems, totalPrice: subtotal } = await validateAndPriceItems(req.body.items, {
    reservationPricing: true,
    activeOnly: true,
  });
  // Oluşturma anında sabitlenen indirim yüzdesi korunur
  const pricing = applyDiscount(subtotal, discountPercent);

  const reservation = await prisma.$transaction(async (tx) => {
    await tx.reservationItem.deleteMany({ where: { reservationId: id } });
    return tx.reservation.update({
      where: { id },
      data: { ...data, ...pricing, items: { create: newItems } },
    });
  });

  bus.emit("shooting-list-changed");
  res.json({
    message: "Rezervasyon güncellendi",
    reservation: { id: reservation.id, totalPrice: pricing.totalPrice },
  });
};

// Müşteri: kendi rezervasyonunu siler (ödeme öncesi)
export const deleteMyReservation = async (req, res) => {
  const { id } = await findOwnEditableReservation(req);
  await refundOnDelete(id);
  await prisma.reservation
    .delete({ where: { id } })
    .catch(rethrowPrismaError(RESERVATION_NOT_FOUND));

  bus.emit("shooting-list-changed");
  res.json({ message: "Rezervasyon silindi" });
};

export const updateReservation = async (req, res) => {
  const { id } = req.params;
  const { status, items } = req.body;

  if (status && !VALID_RESERVATION_STATUSES.includes(status)) {
    throw new AppError("Geçersiz rezervasyon durumu", 400);
  }

  const data = {
    ...buildPartialCustomerUpdate(req.body),
    ...(status && { status }),
  };

  // Teslimat maili için önceki durumu bilmemiz gerekiyor
  const existing = await prisma.reservation.findUnique({
    where: { id },
    select: {
      status: true,
      deliveries: true,
      discountPercent: true,
      customerEmail: true,
      athleteName: true,
      clubName: true,
      birthYear: true,
      customerPhone: true,
    },
  });
  if (!existing) {
    throw new AppError("Rezervasyon bulunamadı", 404);
  }

  // E-posta değiştiyse kayıt yeni e-postanın hesabına taşınır (profilinde görünsün)
  if (data.customerEmail && data.customerEmail !== existing.customerEmail) {
    const account = await resolveGuestAccount({ ...existing, ...data });
    data.userId = account.userId;
  }

  // Durum seçicisinden DELIVERED'a ilk geçiş = GENEL teslim ("dosyalarınız hazır" maili).
  // Parça parça teslim (foto/video/reels) POST /:id/deliver ile yapılır.
  // Durum değiştiyse sadakat puanı da senkronlanır (ödendi → puan, iptal → geri al).
  const general =
    status === "DELIVERED" && existing.status !== "DELIVERED" ? generalDeliveryOnStatus(existing) : null;
  if (general) Object.assign(data, general.data);
  const notifyDelivered = (reservation) => {
    if (status) syncPointsForRecord("reservation", reservation);
    if (general?.notify) notifyDelivery(reservation, "general");
  };

  // Items gönderilmediyse sadece basit güncelleme
  if (items === undefined) {
    const reservation = await prisma.reservation
      .update({ where: { id }, data, include: { items: true } })
      .catch(rethrowPrismaError(RESERVATION_NOT_FOUND));

    // Sporcu adı / alet / paket değişikliği de çekim listesi eşleşmesini etkiler
    bus.emit("shooting-list-changed");
    notifyDelivered(reservation);

    return res.json({ message: "Rezervasyon güncellendi", reservation });
  }

  // Items gönderildiyse: fiyatları DB'den yeniden hesapla, eski item'ları silip
  // yenilerini transaction içinde oluştur. activeOnly:false → admin pasif paketleri
  // de düzenleyebilsin.
  const { items: newItems, totalPrice: subtotal } = await validateAndPriceItems(items, {
    reservationPricing: true,
    activeOnly: false,
  });
  const pricing = applyDiscount(subtotal, existing.discountPercent);

  const reservation = await prisma
    .$transaction(async (tx) => {
      await tx.reservationItem.deleteMany({ where: { reservationId: id } });
      return tx.reservation.update({
        where: { id },
        data: { ...data, ...pricing, items: { create: newItems } },
        include: { items: true },
      });
    })
    .catch(rethrowPrismaError(RESERVATION_NOT_FOUND));

  // Sporcu adı / alet / paket değişikliği de çekim listesi eşleşmesini etkiler
  bus.emit("shooting-list-changed");
  notifyDelivered(reservation);

  res.json({ message: "Rezervasyon güncellendi", reservation });
};

// Admin: bir parçayı teslim et (photo / video / reels / general) + o parçanın maili
export const deliverReservation = async (req, res) => {
  const { record, mailed, already } = await deliverRecord("reservation", req.params.id, {
    type: req.body?.type,
    resend: req.body?.resend === true,
  });
  res.json({
    message: mailed ? "Teslimat kaydedildi, mail gönderildi" : "Teslimat kaydedildi",
    reservation: record,
    mailed,
    already,
  });
};

export const deleteReservation = async (req, res) => {
  await refundOnDelete(req.params.id);
  await prisma.reservation
    .delete({ where: { id: req.params.id } })
    .catch(rethrowPrismaError(RESERVATION_NOT_FOUND));

  bus.emit("shooting-list-changed");

  res.json({ message: "Rezervasyon silindi" });
};

// Dashboard için rezervasyon istatistikleri
export const getReservationStats = async (req, res) => {
  const [total, confirmed, pending, paid, recentReservations, revenue] =
    await Promise.all([
      prisma.reservation.count(),
      prisma.reservation.count({ where: { status: "CONFIRMED" } }),
      prisma.reservation.count({ where: { status: "PENDING" } }),
      prisma.reservation.count({ where: { status: { in: ["PAID", "DELIVERED"] } } }),
      prisma.reservation.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          athleteName: true,
          clubName: true,
          totalPrice: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.reservation.aggregate({
        where: { status: { in: ["CONFIRMED", "PAID", "DELIVERED"] } },
        _sum: { totalPrice: true },
      }),
    ]);

  res.json({
    total,
    confirmed,
    pending,
    paid,
    revenue: revenue._sum.totalPrice || 0,
    recentReservations,
  });
};
