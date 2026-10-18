import prisma from "../lib/prisma.js";
import { AppError, rethrowPrismaError } from "../utils/errors.js";
import { ROLES } from "../utils/roles.js";
import { POINT_TYPES, getBalance, getTierInfo } from "../utils/loyalty.js";
import { localize, sanitizeTranslations } from "../utils/i18n.js";

const TIER_NOT_FOUND = { notFound: "Seviye bulunamadı" };

// locale verilirse ad o dile çevrilir; translations admin formu için hep gelir
const formatTier = (t, locale) =>
  t && {
    id: t.id,
    name: localize(t, locale, ["name"]).name,
    minPoints: t.minPoints,
    discountPercent: t.discountPercent,
    translations: t.translations ?? {},
  };

// Bir kullanıcının puan özeti + son hareketleri (müşteri profili ve admin ortak)
const loyaltySummary = async (userId, locale) => {
  const balance = await getBalance(userId);
  const [{ tier, nextTier, pointsToNext }, transactions] = await Promise.all([
    getTierInfo(balance),
    prisma.pointTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, amount: true, type: true, note: true, createdAt: true },
    }),
  ]);
  return {
    balance,
    tier: formatTier(tier, locale),
    nextTier: formatTier(nextTier, locale),
    pointsToNext,
    transactions,
  };
};

const validateTierInput = ({ name, minPoints, discountPercent, translations }) => {
  const cleanName = name ? String(name).trim().slice(0, 50) : "";
  const min = Math.round(Number(minPoints));
  const percent = Math.round(Number(discountPercent));
  if (!cleanName) throw new AppError("Seviye adı gerekli", 400);
  if (!Number.isFinite(min) || min < 1) throw new AppError("Gereken puan en az 1 olmalı", 400);
  if (!Number.isFinite(percent) || percent < 1 || percent > 90) {
    throw new AppError("İndirim %1 ile %90 arasında olmalı", 400);
  }
  return {
    name: cleanName,
    minPoints: min,
    discountPercent: percent,
    ...(translations !== undefined && {
      translations: sanitizeTranslations(translations, { stringFields: ["name"] }),
    }),
  };
};

// Public: seviye tablosu
export const getTiers = async (req, res) => {
  const tiers = await prisma.loyaltyTier.findMany({ orderBy: { minPoints: "asc" } });
  res.json(tiers.map((t) => formatTier(t, req.locale)));
};

// Müşteri: kendi puanı
export const getMyLoyalty = async (req, res) => {
  res.json(await loyaltySummary(req.user.id, req.locale));
};

// Admin: seviye ekle / güncelle / sil
export const createTier = async (req, res) => {
  const tier = await prisma.loyaltyTier
    .create({ data: validateTierInput(req.body) })
    .catch(rethrowPrismaError({ duplicate: "Bu puan eşiğinde zaten bir seviye var" }));
  res.status(201).json({ message: "Seviye oluşturuldu", tier: formatTier(tier) });
};

export const updateTier = async (req, res) => {
  const tier = await prisma.loyaltyTier
    .update({ where: { id: req.params.id }, data: validateTierInput(req.body) })
    .catch(
      rethrowPrismaError({ ...TIER_NOT_FOUND, duplicate: "Bu puan eşiğinde zaten bir seviye var" })
    );
  res.json({ message: "Seviye güncellendi", tier: formatTier(tier) });
};

export const deleteTier = async (req, res) => {
  await prisma.loyaltyTier
    .delete({ where: { id: req.params.id } })
    .catch(rethrowPrismaError(TIER_NOT_FOUND));
  res.json({ message: "Seviye silindi" });
};

// Admin: bir kullanıcının puanı
export const getUserLoyalty = async (req, res) => {
  res.json(await loyaltySummary(req.params.userId));
};

// Admin: elle puan düzeltme (açıklama zorunlu).
//   { amount: +50 | -20 }  → ekle/çıkar
//   { setTo: 300 }         → bakiyeyi bu değere getir (fark ADJUST olarak yazılır)
// Her iki durumda da defterde iz kalır; bakiye doğrudan ezilmez.
export const adjustUserPoints = async (req, res) => {
  const note = req.body.note ? String(req.body.note).trim().slice(0, 200) : "";
  if (!note) {
    throw new AppError("Açıklama gerekli", 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.params.userId },
    select: { role: true },
  });
  if (!user || user.role !== ROLES.CUSTOMER) {
    throw new AppError("Müşteri bulunamadı", 404);
  }

  let amount;
  if (req.body.setTo !== undefined) {
    const target = Math.round(Number(req.body.setTo));
    if (!Number.isFinite(target) || target < 0 || target > 1000000) {
      throw new AppError("Geçerli bir puan değeri girin", 400);
    }
    amount = target - (await getBalance(req.params.userId));
    if (amount === 0) {
      throw new AppError("Puan zaten bu değerde", 400);
    }
  } else {
    amount = Math.round(Number(req.body.amount));
    if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 100000) {
      throw new AppError("Geçerli bir puan miktarı girin", 400);
    }
  }

  await prisma.pointTransaction.create({
    data: {
      userId: req.params.userId,
      amount,
      type: POINT_TYPES.ADJUST,
      note,
      createdById: req.user.id,
    },
  });

  res.status(201).json({
    message: "Puan güncellendi",
    ...(await loyaltySummary(req.params.userId)),
  });
};
