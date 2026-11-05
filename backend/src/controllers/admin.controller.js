import prisma from "../lib/prisma.js";
import { AppError } from "../utils/errors.js";
import { ROLES } from "../utils/roles.js";

/**
 * Admin paneli yardımcı uçları: menü rozetleri + hızlı arama (Ctrl+K).
 *
 * Rozet kuralı: "bu hesabın o sayfaya son bakışından beri gelen yeni kayıt".
 * Sayfaya girince o bölümün zamanı şimdiye çekilir (POST /badges/seen) → rozet sıfırlanır.
 * Her admin hesabı kendi zamanlarını tutar (AdminSeen tablosu).
 */

export const BADGE_SECTIONS = ["orders", "reservations", "shopOrders", "feedback"];

// Tablo henüz oluşturulmadıysa (db:push yapılmadı) rozetler sessizce kapanır, panel çalışmaya devam eder
const isMissingTable = (err) => err?.code === "P2021" || /admin_seen/i.test(String(err?.message));

const readSeen = async (userId) => {
  const row = await prisma.adminSeen.findUnique({ where: { userId } });
  if (row) return row.seen ?? {};
  // İlk açılış: geçmiş kayıtlar rozet olmasın — tüm bölümler "şimdi" sayılır
  const now = new Date().toISOString();
  const seen = Object.fromEntries(BADGE_SECTIONS.map((s) => [s, now]));
  await prisma.adminSeen.create({ data: { userId, seen } }).catch(() => {});
  return seen;
};

const since = (seen, section) => {
  const date = new Date(seen?.[section] ?? Date.now());
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const UNAVAILABLE = { orders: 0, reservations: 0, shopOrders: 0, feedback: 0, unavailable: true };

// Dört sayım tek sorguda: uzak veritabanında her ayrı sorgu bir gidiş-dönüş (~120 ms+)
const countBadges = async (seen) => {
  const [row] = await prisma.$queryRaw`
    SELECT
      (SELECT COUNT(*) FROM "orders"
        WHERE "status"::text IN ('PAID', 'DELIVERED') AND "createdAt" > ${since(seen, "orders")})::int AS orders,
      (SELECT COUNT(*) FROM "reservations"
        WHERE "status"::text <> 'CANCELLED' AND "createdAt" > ${since(seen, "reservations")})::int AS reservations,
      (SELECT COUNT(*) FROM "shop_orders"
        WHERE "status"::text IN ('CONFIRMED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED')
          AND "paidAt" > ${since(seen, "shopOrders")})::int AS "shopOrders",
      (SELECT COUNT(*) FROM "feedbacks" WHERE "createdAt" > ${since(seen, "feedback")})::int AS feedback
  `;
  return { orders: row.orders, reservations: row.reservations, shopOrders: row.shopOrders, feedback: row.feedback };
};

// GET /api/admin/badges → { orders, reservations, shopOrders, feedback }
export const getBadges = async (req, res) => {
  try {
    res.json(await countBadges(await readSeen(req.user.id)));
  } catch (err) {
    if (isMissingTable(err)) return res.json(UNAVAILABLE);
    throw err;
  }
};

// POST /api/admin/badges/seen { section } → o bölüm "şimdi görüldü"; cevap güncel rozetler
// (açık sayfadayken ayrıca GET atılmasın diye)
export const markBadgeSeen = async (req, res) => {
  const section = req.body?.section;
  if (!BADGE_SECTIONS.includes(section)) throw new AppError("Geçersiz bölüm", 400);
  try {
    const current = await readSeen(req.user.id);
    const seen = { ...current, [section]: new Date().toISOString() };
    const [, badges] = await Promise.all([
      prisma.adminSeen.upsert({
        where: { userId: req.user.id },
        create: { userId: req.user.id, seen },
        update: { seen },
      }),
      countBadges(seen),
    ]);
    res.json(badges);
  } catch (err) {
    if (isMissingTable(err)) return res.json(UNAVAILABLE);
    throw err;
  }
};

// GET /api/admin/search?q= → her gruptan en fazla 5 kayıt (tek tur, Promise.all)
const PER_GROUP = 5;
export const globalSearch = async (req, res) => {
  const q = String(req.query.q ?? "").trim().slice(0, 100);
  if (q.length < 2) return res.json({ orders: [], reservations: [], shopOrders: [], users: [] });

  const text = { contains: q, mode: "insensitive" };
  const recordWhere = {
    OR: [{ athleteName: text }, { clubName: text }, { customerPhone: { contains: q } }, { customerEmail: text }],
  };
  const recordSelect = {
    id: true,
    athleteName: true,
    clubName: true,
    customerPhone: true,
    totalPrice: true,
    status: true,
    createdAt: true,
  };

  const [orders, reservations, shopOrders, users] = await Promise.all([
    prisma.order.findMany({ where: recordWhere, select: recordSelect, orderBy: { createdAt: "desc" }, take: PER_GROUP }),
    prisma.reservation.findMany({ where: recordWhere, select: recordSelect, orderBy: { createdAt: "desc" }, take: PER_GROUP }),
    prisma.shopOrder.findMany({
      where: {
        OR: [
          { recipientName: text },
          { phone: { contains: q } },
          { productName: text },
          { user: { email: text } },
        ],
      },
      select: { id: true, productName: true, recipientName: true, phone: true, totalPrice: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: PER_GROUP,
    }),
    prisma.user.findMany({
      where: { role: ROLES.CUSTOMER, OR: [{ name: text }, { email: text }, { phone: { contains: q } }] },
      select: { id: true, name: true, email: true, phone: true },
      orderBy: { createdAt: "desc" },
      take: PER_GROUP,
    }),
  ]);
  res.json({ orders, reservations, shopOrders, users });
};
