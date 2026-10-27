import prisma from "../lib/prisma.js";
import { AppError, rethrowPrismaError } from "../utils/errors.js";

const FEEDBACK_NOT_FOUND = { notFound: "Görüş bulunamadı" };
const MAX_LENGTH = 1000;
const DAILY_LIMIT = 5; // Bir hesap 24 saatte en fazla bu kadar görüş gönderebilir
const PAGES = ["galerim"];

// Müşteri (girişli): Galerim'in altındaki form
export const createFeedback = async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (message.length < 3) throw new AppError("Lütfen görüşünüzü yazın (en az 3 karakter)", 400);
  if (message.length > MAX_LENGTH) throw new AppError("Görüşünüz en fazla 1000 karakter olabilir", 400);

  const raw = req.body?.rating;
  const rating = raw === undefined || raw === null || raw === "" ? null : Number(raw);
  if (rating !== null && !(Number.isInteger(rating) && rating >= 1 && rating <= 5)) {
    throw new AppError("Puan 1 ile 5 arasında olmalı", 400);
  }

  const recent = await prisma.feedback.count({
    where: { userId: req.user.id, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
  if (recent >= DAILY_LIMIT) {
    throw new AppError("Bugün çok fazla görüş gönderdiniz, lütfen yarın tekrar deneyin", 429);
  }

  await prisma.feedback.create({
    data: {
      userId: req.user.id,
      rating,
      message,
      page: PAGES.includes(req.body?.page) ? req.body.page : "galerim",
      locale: req.locale || "tr",
    },
  });

  res.status(201).json({ message: "Görüşünüz için teşekkürler!" });
};

// Admin: tüm görüşler (en yeni önce) + okunmamış sayısı
export const getAllFeedback = async (req, res) => {
  const unreadOnly = req.query.unread === "1";
  const [items, unread, total] = await Promise.all([
    prisma.feedback.findMany({
      where: unreadOnly ? { isRead: false } : undefined,
      orderBy: { createdAt: "desc" },
      take: 500,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.feedback.count({ where: { isRead: false } }),
    prisma.feedback.count(),
  ]);
  res.json({ data: items, unread, total });
};

// Admin: okundu / okunmadı
export const updateFeedback = async (req, res) => {
  if (typeof req.body?.isRead !== "boolean") throw new AppError("Geçersiz istek", 400);
  const feedback = await prisma.feedback
    .update({ where: { id: req.params.id }, data: { isRead: req.body.isRead } })
    .catch(rethrowPrismaError(FEEDBACK_NOT_FOUND));
  res.json({ message: "Görüş güncellendi", feedback });
};

// Admin: sil
export const deleteFeedback = async (req, res) => {
  await prisma.feedback
    .delete({ where: { id: req.params.id } })
    .catch(rethrowPrismaError(FEEDBACK_NOT_FOUND));
  res.json({ message: "Görüş silindi" });
};
