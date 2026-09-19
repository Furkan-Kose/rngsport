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
  resolveGuestAccount,
  syncProfileGaps,
  claimStatusFor,
  issueSetPasswordTokenIfUnclaimed,
} from "../utils/customerAccount.js";
import { sendDeliveryEmail } from "../lib/mail.js";

const VALID_ORDER_STATUSES = ["PENDING", "PAID", "FAILED", "CANCELLED", "DELIVERED"];

const formatOrderForResponse = (order) => ({
  id: order.id,
  athleteName: order.athleteName,
  clubName: order.clubName,
  birthYear: order.birthYear,
  customerPhone: order.customerPhone,
  customerEmail: order.customerEmail,
  notes: order.notes,
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
  })),
});

export const createOrder = async (req, res) => {
  if (!req.body.items || req.body.items.length === 0) {
    throw new AppError("Tüm zorunlu alanları doldurun", 400);
  }

  const customer = validateRequiredCustomerInfo(req.body);
  const { items, totalPrice } = await validateAndPriceItems(req.body.items, {
    reservationPricing: false,
    activeOnly: true,
  });

  // optionalAuth: girişliyse kendi hesabı; misafirse e-postasından hesap açılır/bulunur.
  // Sipariş maili ödeme onaylanınca gidiyor (payment.controller.js), burada mail yok.
  const account = req.user?.id
    ? { userId: req.user.id, status: "linked" }
    : await resolveGuestAccount(customer);

  // Girişli kullanıcının profilindeki BOŞ sporcu alanlarını doldur (doluyu ezmeden),
  // böylece bir sonraki sefer form ön-dolu gelir. Beklenmez — siparişi geciktirmesin.
  if (req.user?.id) syncProfileGaps(req.user.id, customer);

  const order = await prisma.order.create({
    data: {
      ...customer,
      notes: sanitizeNotes(req.body.notes),
      totalPrice,
      ...(account.userId && { userId: account.userId }),
      items: { create: items },
    },
    include: { items: true },
  });

  res.status(201).json({
    message: "Sipariş oluşturuldu",
    account: { status: account.status, email: order.customerEmail },
    order: {
      id: order.id,
      athleteName: order.athleteName,
      clubName: order.clubName,
      customerEmail: order.customerEmail,
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
    where: { userId: req.user.id },
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

  if (status) bus.emit("shooting-list-changed");

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
