import prisma from "../lib/prisma.js";
import { ROLES } from "./roles.js";

// Sadakat sistemi.
//
// KAZANMA: Puan ÖDEME ALININCA yazılır (rezervasyon PAID/DELIVERED, sipariş PAID),
// oluştururken değil — ödenmemiş kayıt eklemek/güncellemek puan getirmez.
//
// HARCAMA: Bakiye bir seviyeye ulaştıysa o seviyenin indirimi otomatik uygulanır ve
// seviyenin puanı (minPoints) harcanır; fazlası kalır. Rezervasyonda puan oluşturunca
// düşer (ödeme elden, sonra), siparişte ödeme başarılı olunca düşer (terk edilen
// sepet puan yakmasın). Ödenmeden silinen/iptal edilen kayıtta harcanan puan iade edilir.
//
// Her hareket ayrı bir defterde (PointTransaction) tutulur; kaynak rezervasyon/sipariş
// silinse de kalır. Bakiye = defter toplamı.

export const POINT_TYPES = {
  EARN: "EARN",
  REVERSE: "REVERSE",
  REDEEM: "REDEEM",
  REFUND: "REFUND",
  ADJUST: "ADJUST",
};

// Puanın yazıldığı / geri alındığı durumlar
const PAID_STATUSES = new Set(["PAID", "DELIVERED"]);
const REVERSAL_STATUSES = new Set(["CANCELLED", "FAILED"]);

const sourceLabel = (sourceType) => (sourceType === "order" ? "online sipariş" : "rezervasyon");

export const getBalance = async (userId, db = prisma) => {
  const { _sum } = await db.pointTransaction.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return _sum.amount ?? 0;
};

// Puana karşılık gelen seviye + bir sonraki seviye
export const getTierInfo = async (balance, db = prisma) => {
  const tiers = await db.loyaltyTier.findMany({ orderBy: { minPoints: "asc" } });
  const current = [...tiers].reverse().find((t) => balance >= t.minPoints) ?? null;
  const next = tiers.find((t) => t.minPoints > balance) ?? null;
  return {
    tier: current,
    nextTier: next,
    pointsToNext: next ? next.minPoints - balance : 0,
  };
};

// İndirimli tutarlar. Kuruşa yuvarlanır; toplam her zaman subtotal − indirim.
export const applyDiscount = (subtotal, discountPercent) => {
  const percent = Math.min(100, Math.max(0, Math.round(discountPercent || 0)));
  const discountAmount = Math.round(subtotal * percent) / 100;
  return {
    subtotal,
    discountPercent: percent,
    discountAmount,
    totalPrice: Math.round((subtotal - discountAmount) * 100) / 100,
  };
};

/**
 * Yeni kayıtta indirimi (ve puan harcamasını) kimin hesabı karşılar?
 *   girişli müşteri → kendi hesabı
 *   admin panelden  → formdaki e-postanın hesabı
 *   misafir         → kimse (başkasının e-postasını yazıp puanını harcayamasın)
 */
export const discountAccountFor = (role, requesterId, accountUserId) => {
  if (role === ROLES.CUSTOMER) return requesterId;
  if (role === ROLES.ADMIN) return accountUserId ?? null;
  return null;
};

/**
 * iyzico sepeti için kalem tutarları: indirim kalemlere oranlı dağıtılır.
 * iyzico kalem toplamının ödenecek tutara kuruşu kuruşuna eşit olmasını istiyor;
 * yuvarlama farkı son kaleme yazılır.
 */
export const distributeTotal = (lineTotals, totalPrice) => {
  const subtotal = lineTotals.reduce((sum, v) => sum + v, 0);
  const ratio = subtotal > 0 ? totalPrice / subtotal : 1;
  let allocated = 0;
  return lineTotals.map((lineTotal, index) => {
    const value =
      index === lineTotals.length - 1
        ? Math.round((totalPrice - allocated) * 100) / 100
        : Math.round(lineTotal * ratio * 100) / 100;
    allocated += value;
    return value;
  });
};

const sumPoints = (items) => items.reduce((sum, item) => sum + (item.points || 0), 0);

// Bir kaynağın verilen hareket türlerindeki net toplamı
const netForSource = async (db, sourceType, sourceId, types) => {
  const { _sum } = await db.pointTransaction.aggregate({
    where: { sourceType, sourceId, type: { in: types } },
    _sum: { amount: true },
  });
  return _sum.amount ?? 0;
};
const earnedNet = (db, sourceType, id) =>
  netForSource(db, sourceType, id, [POINT_TYPES.EARN, POINT_TYPES.REVERSE]);
const redeemedNet = (db, sourceType, id) =>
  netForSource(db, sourceType, id, [POINT_TYPES.REDEEM, POINT_TYPES.REFUND]);

// Kullanıcı başına kilit: aynı müşterinin puan işlemleri (harcama, kazanım, iade)
// sırayla çalışır — aynı bakiye iki kez harcanamaz, aynı kayıt iki kez puanlanmaz.
// Farklı müşteriler birbirini beklemez. (Önceden Serializable kullanılıyordu; yoğunlukta
// PostgreSQL alakasız işlemleri de çakışma sayıp reddediyor, puan sessizce kayboluyordu.)
// Kilit transaction bitince kendiliğinden bırakılır.
const withUserLock = (userId, fn) =>
  prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
      return fn(tx);
    },
    // Uzak veritabanında sorgu başı 100-400 ms olabiliyor; varsayılan 5 sn dar kalır
    { maxWait: 10000, timeout: 20000 }
  );

const isCustomer = async (db, userId) => {
  if (!userId) return false;
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  return user?.role === ROLES.CUSTOMER;
};

/**
 * Kaydı seviye indirimiyle oluşturur (tek transaction).
 * discountUserId'nin bakiyesi bir seviyeye ulaşıyorsa indirim uygulanır, yüzde ve
 * harcanacak puan kayda sabitlenir. Rezervasyonda puan burada düşer; siparişte
 * ödeme anında (syncPointsForRecord).
 *
 *   model: "reservation" | "order"
 *   data:  indirim alanları hariç create verisi (items dahil)
 */
export const createWithDiscount = async ({ model, discountUserId, subtotal, data }) => {
  // Misafir / indirim hakkı olmayan: kilit ve transaction gerekmez
  if (!(await isCustomer(prisma, discountUserId))) {
    return prisma[model].create({
      data: { ...data, ...applyDiscount(subtotal, 0), redeemPoints: 0 },
      include: { items: true },
    });
  }

  return withUserLock(discountUserId, async (tx) => {
    const { tier } = await getTierInfo(await getBalance(discountUserId, tx), tx);

    const record = await tx[model].create({
      data: {
        ...data,
        ...applyDiscount(subtotal, tier?.discountPercent ?? 0),
        redeemPoints: tier?.minPoints ?? 0,
      },
      include: { items: true },
    });

    if (model === "reservation" && tier) {
      await tx.pointTransaction.create({
        data: {
          userId: discountUserId,
          amount: -tier.minPoints,
          type: POINT_TYPES.REDEEM,
          sourceType: model,
          sourceId: record.id,
          note: `${record.athleteName} — ${tier.name} indirimi (%${tier.discountPercent})`,
        },
      });
    }
    return record;
  });
};

/**
 * Online ödeme başlamadan: siparişteki indirim için bakiye hâlâ yetiyor mu?
 * (Sipariş oluşturulduktan sonra puan başka yerde harcanmış olabilir.)
 */
export const hasPointsForOrder = async (order) => {
  if (!order.redeemPoints) return true;
  if (!order.userId) return false;
  const alreadyRedeemed = (await redeemedNet(prisma, "order", order.id)) < 0;
  return alreadyRedeemed || (await getBalance(order.userId)) >= order.redeemPoints;
};

/**
 * Durum değişikliğinden sonra çağrılır; defteri kayıt durumuyla senkronlar.
 *   ödendi/teslim  → EARN (bir kez) + siparişte indirim puanını REDEEM (bir kez)
 *   iptal/başarısız → kazanılanı REVERSE + harcananı REFUND
 * Diğer geçişler (ör. PAID → CONFIRMED) deftere dokunmaz.
 *
 * Fire-and-forget: hata loglanır, durum güncellemesini asla düşürmez.
 */
export const syncPointsForRecord = async (sourceType, record) => {
  try {
    if (!record?.userId) return;
    const paid = PAID_STATUSES.has(record.status);
    const reversed = REVERSAL_STATUSES.has(record.status);
    if (!paid && !reversed) return;
    if (!(await isCustomer(prisma, record.userId))) return;

    await withUserLock(record.userId, async (tx) => {
      const base = { userId: record.userId, sourceType, sourceId: record.id };
      const earned = await earnedNet(tx, sourceType, record.id);
      const redeemed = await redeemedNet(tx, sourceType, record.id);

      if (paid) {
        const amount = sumPoints(record.items || []);
        if (earned === 0 && amount > 0) {
          await tx.pointTransaction.create({
            data: { ...base, amount, type: POINT_TYPES.EARN, note: `${record.athleteName} — ${sourceLabel(sourceType)}` },
          });
        }
        if (sourceType === "order" && record.redeemPoints > 0 && redeemed === 0) {
          await tx.pointTransaction.create({
            data: {
              ...base,
              amount: -record.redeemPoints,
              type: POINT_TYPES.REDEEM,
              note: `${record.athleteName} — seviye indirimi (%${record.discountPercent})`,
            },
          });
        }
      } else {
        if (earned > 0) {
          await tx.pointTransaction.create({
            data: { ...base, amount: -earned, type: POINT_TYPES.REVERSE, note: `${record.athleteName} — iptal edildi` },
          });
        }
        if (redeemed < 0) {
          await tx.pointTransaction.create({
            data: { ...base, amount: -redeemed, type: POINT_TYPES.REFUND, note: `${record.athleteName} — iptal, puan iadesi` },
          });
        }
      }
    });
  } catch (error) {
    console.error(`[loyalty] Puan senkronlanamadı (${sourceType} ${record?.id}):`, error);
  }
};

/**
 * Kayıt silinmeden ÖNCE çağrılır. Ödenmemiş kayıtta indirim için harcanan puan
 * iade edilir; ödenmiş kayıtta (yarışma sonrası temizlik) hiçbir şey değişmez.
 */
export const refundIfUnpaid = async (sourceType, record) => {
  try {
    if (!record?.userId || PAID_STATUSES.has(record.status)) return;
    await withUserLock(record.userId, async (tx) => {
      const redeemed = await redeemedNet(tx, sourceType, record.id);
      if (redeemed < 0) {
        await tx.pointTransaction.create({
          data: {
            userId: record.userId,
            amount: -redeemed,
            type: POINT_TYPES.REFUND,
            sourceType,
            sourceId: record.id,
            note: `${record.athleteName} — ${sourceLabel(sourceType)} silindi, puan iadesi`,
          },
        });
      }
    });
  } catch (error) {
    console.error(`[loyalty] Puan iadesi yapılamadı (${sourceType} ${record?.id}):`, error);
  }
};
