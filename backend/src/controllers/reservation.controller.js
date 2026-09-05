import prisma from "../lib/prisma.js";
import bus from "../lib/events.js";
import { AppError, rethrowPrismaError } from "../utils/errors.js";
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
import { matchKey } from "../utils/names.js";
import { sendDeliveryEmail } from "../lib/mail.js";

const VALID_RESERVATION_STATUSES = ["PENDING", "CONFIRMED", "PAID", "CANCELLED", "DELIVERED"];
const RESERVATION_NOT_FOUND = { notFound: "Rezervasyon bulunamadı" };

export const getAllReservations = async (req, res) => {
  const { page, limit, skip, status, search } = parsePaginationQuery(req);
  const where = buildCustomerSearchWhere({ status, search });

  const [reservations, total, shootingNames] = await Promise.all([
    prisma.reservation.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.reservation.count({ where }),
    prisma.shootingListEntry.findMany({ select: { athleteName: true } }),
  ]);

  // Çekim listesindeki isimleri normalize edip Set'e koy; sporcu adı eşleşmesi
  // için (yalnızca isim bazlı). Liste hiç yoksa eşleşme uygulanamaz → null.
  const nameSet = new Set(shootingNames.map((e) => matchKey(e.athleteName)));
  const hasList = nameSet.size > 0;

  res.json({
    data: reservations.map((r) => ({
      ...r,
      inShootingList: hasList ? nameSet.has(matchKey(r.athleteName)) : null,
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

  res.json({
    id: reservation.id,
    athleteName: reservation.athleteName,
    clubName: reservation.clubName,
    birthYear: reservation.birthYear,
    customerPhone: reservation.customerPhone,
    customerEmail: reservation.customerEmail,
    notes: reservation.notes,
    totalPrice: reservation.totalPrice,
    status: reservation.status,
    createdAt: reservation.createdAt,
    items: reservation.items.map((item) => ({
      package: {
        id: item.packageId,
        name: item.packageName,
        category: item.category,
      },
      seriesCount: item.seriesCount,
      quantity: item.quantity,
      price: item.price,
      apparatuses: item.apparatuses,
    })),
  });
};

export const createReservation = async (req, res) => {
  if (!req.body.items || req.body.items.length === 0) {
    throw new AppError("Tüm zorunlu alanları doldurun", 400);
  }

  const customer = validateRequiredCustomerInfo(req.body);
  const { items, totalPrice } = await validateAndPriceItems(req.body.items, {
    reservationPricing: true,
    activeOnly: true,
  });

  const reservation = await prisma.reservation.create({
    data: {
      ...customer,
      notes: sanitizeNotes(req.body.notes),
      totalPrice,
      ...(req.user?.id && { userId: req.user.id }), // optionalAuth: girişliyse hesaba bağla
      items: { create: items },
    },
    include: { items: true },
  });

  res.status(201).json({
    message: "Rezervasyon oluşturuldu",
    reservation: {
      id: reservation.id,
      athleteName: reservation.athleteName,
      clubName: reservation.clubName,
      customerEmail: reservation.customerEmail,
      totalPrice: reservation.totalPrice,
      status: reservation.status,
      items: reservation.items.map((item) => ({
        package: { id: item.packageId, name: item.packageName },
        seriesCount: item.seriesCount,
        quantity: item.quantity,
      })),
    },
  });
};

// Girişli kullanıcının kendi rezervasyonları
export const getMyReservations = async (req, res) => {
  const reservations = await prisma.reservation.findMany({
    where: { userId: req.user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  res.json({
    data: reservations.map((r) => ({
      id: r.id,
      athleteName: r.athleteName,
      clubName: r.clubName,
      totalPrice: r.totalPrice,
      status: r.status,
      createdAt: r.createdAt,
      items: r.items.map((item) => ({
        package: { id: item.packageId, name: item.packageName, category: item.category },
        seriesCount: item.seriesCount,
        quantity: item.quantity,
        price: item.price,
        apparatuses: item.apparatuses,
      })),
    })),
  });
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
    select: { status: true },
  });
  if (!existing) {
    throw new AppError("Rezervasyon bulunamadı", 404);
  }

  // DELIVERED'a ilk geçişte müşteriye "fotoğraflarınız hazır" maili (fire-and-forget)
  const notifyDelivered = (reservation) => {
    if (status === "DELIVERED" && existing.status !== "DELIVERED" && reservation.customerEmail) {
      sendDeliveryEmail(reservation.customerEmail, reservation.athleteName);
    }
  };

  // Items gönderilmediyse sadece basit güncelleme
  if (items === undefined) {
    const reservation = await prisma.reservation
      .update({ where: { id }, data, include: { items: true } })
      .catch(rethrowPrismaError(RESERVATION_NOT_FOUND));

    if (status) bus.emit("shooting-list-changed");
    notifyDelivered(reservation);

    return res.json({ message: "Rezervasyon güncellendi", reservation });
  }

  // Items gönderildiyse: fiyatları DB'den yeniden hesapla, eski item'ları silip
  // yenilerini transaction içinde oluştur. activeOnly:false → admin pasif paketleri
  // de düzenleyebilsin.
  const { items: newItems, totalPrice } = await validateAndPriceItems(items, {
    reservationPricing: true,
    activeOnly: false,
  });

  const reservation = await prisma
    .$transaction(async (tx) => {
      await tx.reservationItem.deleteMany({ where: { reservationId: id } });
      return tx.reservation.update({
        where: { id },
        data: { ...data, totalPrice, items: { create: newItems } },
        include: { items: true },
      });
    })
    .catch(rethrowPrismaError(RESERVATION_NOT_FOUND));

  if (status) bus.emit("shooting-list-changed");
  notifyDelivered(reservation);

  res.json({ message: "Rezervasyon güncellendi", reservation });
};

export const deleteReservation = async (req, res) => {
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
