import prisma from "../lib/prisma.js";
import bus from "../lib/events.js";
import { AppError, rethrowPrismaError } from "../utils/errors.js";
import {
  validateRequiredCustomerInfo,
  sanitizeNotes,
} from "../utils/validators.js";
import { validateAndPriceItems } from "../utils/items.js";
import {
  parsePaginationQuery,
  buildCustomerSearchWhere,
} from "../utils/pagination.js";
import {
  resolveAccountFor,
  requesterRole,
  ownRecordsWhere,
  syncProfileGaps,
  claimStatusFor,
  issueSetPasswordTokenIfUnclaimed,
} from "../utils/customerAccount.js";
import { sendDeliveryEmail } from "../lib/mail.js";
import {
  createWithDiscount,
  discountAccountFor,
  syncPointsForRecord,
} from "../utils/loyalty.js";

const VALID_ORDER_STATUSES = ["PENDING", "PAID", "FAILED", "CANCELLED", "DELIVERED"];

const formatOrderForResponse = (order) => ({
  id: order.id,
  athleteName: order.athleteName,
  clubName: order.clubName,
  birthYear: order.birthYear,
  customerPhone: order.customerPhone,
  customerEmail: order.customerEmail,
  notes: order.notes,
  subtotal: order.subtotal,
  discountPercent: order.discountPercent,
  discountAmount: order.discountAmount,
  totalPrice: order.totalPrice,
  status: order.status,
  createdAt: order.createdAt,
  items: order.items.map((item) => ({
    package: {
      id: item.packageId,
      name: item.packageName,
      category: item.category,
    },
    seriesCount: item.seriesCount,
    quantity: item.quantity,
    price: item.price,
    apparatuses: item.apparatuses,
    points: item.points,
  })),
});

export const createOrder = async (req, res) => {
  if (!req.body.items || req.body.items.length === 0) {
    throw new AppError("Tüm zorunlu alanları doldurun", 400);
  }

  const customer = validateRequiredCustomerInfo(req.body);
  const { items, totalPrice: subtotal } = await validateAndPriceItems(req.body.items, {
    reservationPricing: false,
    activeOnly: true,
  });

  // Girişli müşteriyse kendi hesabı; misafir/admin ise e-postasından hesap açılır/bulunur.
  // Sipariş maili ödeme onaylanınca gidiyor (payment.controller.js), burada mail yok.
  const account = await resolveAccountFor(req, customer);

  // Müşterinin profilindeki BOŞ sporcu alanlarını doldur (doluyu ezmeden),
  // böylece bir sonraki sefer form ön-dolu gelir. Beklenmez — siparişi geciktirmesin.
  if (account.userId && account.userId === req.user?.id) syncProfileGaps(req.user.id, customer);

  // Sadakat: seviyesi varsa indirim otomatik uygulanır (misafire uygulanmaz).
  // Puan siparişte ÖDEME BAŞARILI olunca harcanır — terk edilen sepet puan yakmaz.
  const order = await createWithDiscount({
    model: "order",
    discountUserId: discountAccountFor(await requesterRole(req), req.user?.id, account.userId),
    subtotal,
    data: {
      ...customer,
      notes: sanitizeNotes(req.body.notes),
      ...(account.userId && { userId: account.userId }),
      items: { create: items },
    },
  });

  res.status(201).json({
    message: "Sipariş oluşturuldu",
    account: { status: account.status, email: order.customerEmail },
    order: {
      id: order.id,
      athleteName: order.athleteName,
      clubName: order.clubName,
      customerEmail: order.customerEmail,
      subtotal: order.subtotal,
      discountPercent: order.discountPercent,
      discountAmount: order.discountAmount,
      totalPrice: order.totalPrice,
      items: order.items.map((item) => ({
        package: { id: item.packageId, name: item.packageName },
        seriesCount: item.seriesCount,
        quantity: item.quantity,
      })),
    },
  });
};

export const getAllOrders = async (req, res) => {
  const { page, limit, skip, status, search } = parsePaginationQuery(req);
  const where = buildCustomerSearchWhere({ status, search });

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    data: orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

// Girişli kullanıcının kendi siparişleri
export const getMyOrders = async (req, res) => {
  const orders = await prisma.order.findMany({
    where: await ownRecordsWhere(req.user.id),
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  res.json({ data: orders.map(formatOrderForResponse) });
};

export const getOrder = async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    // user: OrderSuccessPage'deki "hesabını tamamla" kartı için (bkz. accountStatus)
    include: { items: true, user: { select: { role: true, password: true } } },
  });

  if (!order) {
    throw new AppError("Sipariş bulunamadı", 404);
  }

  // account: "hesabını tamamla" kartı için. formatOrderForResponse alanları tek tek
  // yazdığı için user ilişkisi (şifre hash'i dahil) yanıta asla sızmaz.
  res.json({
    ...formatOrderForResponse(order),
    account: { status: claimStatusFor(order), email: order.customerEmail },
  });
};

export const updateOrder = async (req, res) => {
  const { status, paymentId } = req.body;

  if (status && !VALID_ORDER_STATUSES.includes(status)) {
    throw new AppError("Geçersiz sipariş durumu", 400);
  }
  if (paymentId && (typeof paymentId !== "string" || paymentId.length > 100)) {
    throw new AppError("Geçersiz ödeme ID", 400);
  }

  // Teslimat maili için önceki durumu bilmemiz gerekiyor
  const existing = await prisma.order.findUnique({
    where: { id: req.params.id },
    select: { status: true },
  });
  if (!existing) {
    throw new AppError("Sipariş bulunamadı", 404);
  }

  const order = await prisma.order
    .update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(paymentId && { paymentId: paymentId.trim() }),
      },
      include: { items: true },
    })
    .catch(rethrowPrismaError({ notFound: "Sipariş bulunamadı" }));

  if (status) {
    bus.emit("shooting-list-changed");
    // Sadakat: ödendi/teslim → puan; iptal → geri al
    syncPointsForRecord("order", order);
  }

  // DELIVERED'a ilk geçişte müşteriye "fotoğraflarınız hazır" maili (fire-and-forget).
  // Hesap hâlâ şifresizse mail doğrudan şifre belirleme linkiyle gider.
  if (status === "DELIVERED" && existing.status !== "DELIVERED" && order.customerEmail) {
    issueSetPasswordTokenIfUnclaimed(order.userId)
      .then((token) => sendDeliveryEmail(order.customerEmail, order.athleteName, token))
      .catch((err) => console.error("[mail] Teslimat maili hatası:", err));
  }

  res.json({ message: "Sipariş güncellendi", order });
};

export const deleteOrder = async (req, res) => {
  await prisma.order
    .delete({ where: { id: req.params.id } })
    .catch(rethrowPrismaError({ notFound: "Sipariş bulunamadı" }));

  bus.emit("shooting-list-changed");

  res.json({ message: "Sipariş silindi" });
};

// Dashboard için sipariş istatistikleri
export const getOrderStats = async (req, res) => {
  const [total, paid, pending, failed, recentOrders, revenue] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ["PAID", "DELIVERED"] } } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "FAILED" } }),
    prisma.order.findMany({
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
    prisma.order.aggregate({
      where: { status: { in: ["PAID", "DELIVERED"] } },
      _sum: { totalPrice: true },
    }),
  ]);

  res.json({
    total,
    paid,
    pending,
    failed,
    revenue: revenue._sum.totalPrice || 0,
    recentOrders,
  });
};
