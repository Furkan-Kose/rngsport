import prisma from "../lib/prisma.js";
import { AppError } from "../utils/errors.js";
import { ROLES } from "../utils/roles.js";
import { tournamentWhere } from "../utils/tournaments.js";
import { matchKey } from "../utils/names.js";
import { APPARATUSES } from "../utils/apparatuses.js";

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
    tournament: { select: { name: true } }, // sonuçta hangi yarışma olduğu görünsün
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

// Ana sayfa "Yarışma detayı": paket, alet ve kulüp dağılımı (?tournamentId=<id>|all).
// Sayılanlar ana sayfadaki para kartlarıyla aynı: onaylanmış / ödenmiş / teslim edilmiş
// rezervasyonlar + ödenmiş online siparişler (bekleyen rezervasyon ve ödenmemiş sipariş sayılmaz).
// Tutar indirimli (ödenecek) tutardır: kaydın totalPrice'ı kalemlere liste fiyatı oranında dağıtılır,
// böylece tablo toplamı = rezervasyon "Toplam tutar" + paket siparişi "Gelir".
// İki sorgu; toplama JS'te — bir yarışmada en fazla birkaç yüz kayıt var.
const SUMMARY_ITEM_SELECT = {
  packageId: true,
  packageName: true,
  price: true,
  seriesCount: true,
  quantity: true,
  priority: true,
  apparatuses: true,
};
const SUMMARY_RECORD_SELECT = { athleteName: true, clubName: true, totalPrice: true, discountAmount: true, items: { select: SUMMARY_ITEM_SELECT } };

export const getTournamentSummary = async (req, res) => {
  const tw = tournamentWhere(req.query.tournamentId);
  const [reservations, orders] = await Promise.all([
    prisma.reservation.findMany({ where: { ...tw, status: { in: ["CONFIRMED", "PAID", "DELIVERED"] } }, select: SUMMARY_RECORD_SELECT }),
    prisma.order.findMany({ where: { ...tw, status: { in: ["PAID", "DELIVERED"] } }, select: SUMMARY_RECORD_SELECT }),
  ]);

  const packages = new Map(); // slug → satır
  const apparatusCounts = Object.fromEntries(APPARATUSES.map((a) => [a.slug, 0]));
  let noApparatus = 0;
  const clubs = new Map(); // kulüp anahtarı → { name, athletes:Set }
  let discountTotal = 0; // verilen sadakat indirimi
  let discountedRecords = 0;

  const add = (records, kind) => {
    for (const record of records) {
      if (record.discountAmount > 0) {
        discountTotal += record.discountAmount;
        discountedRecords += 1;
      }
      // Kulüp: yazım farkı (büyük/küçük harf, Türkçe karakter) aynı kulübü bölmesin
      const clubName = String(record.clubName ?? "").trim();
      const clubKey = matchKey(clubName);
      if (clubKey) {
        if (!clubs.has(clubKey)) clubs.set(clubKey, { name: clubName, athletes: new Set() });
        clubs.get(clubKey).athletes.add(matchKey(record.athleteName));
      }
      const listTotal = record.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      for (const item of record.items) {
        if (!packages.has(item.packageId)) {
          packages.set(item.packageId, {
            slug: item.packageId,
            name: item.packageName,
            reservations: 0,
            orders: 0,
            series: 0,
            priority: 0,
            amount: 0,
          });
        }
        const row = packages.get(item.packageId);
        row[kind] += item.quantity;
        row.series += item.seriesCount * item.quantity;
        if (item.priority) row.priority += item.quantity;
        // İndirimli tutardan bu kalemin payı (liste fiyatı oranında)
        row.amount += listTotal > 0 ? (record.totalPrice * item.price * item.quantity) / listTotal : 0;

        for (const slug of item.apparatuses) {
          if (slug in apparatusCounts) apparatusCounts[slug] += item.quantity;
        }
        noApparatus += Math.max(0, item.seriesCount - item.apparatuses.length) * item.quantity;
      }
    }
  };
  add(reservations, "reservations");
  add(orders, "orders");

  const clubList = [...clubs.values()]
    .map((c) => ({ name: c.name, count: c.athletes.size }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "tr"));

  res.json({
    packages: [...packages.values()]
      .map((row) => ({ ...row, amount: Math.round(row.amount) }))
      .sort(
      (a, b) => b.reservations + b.orders - (a.reservations + a.orders) || a.name.localeCompare(b.name, "tr"),
    ),
    apparatuses: [
      ...APPARATUSES.map((a) => ({ slug: a.slug, label: a.label, count: apparatusCounts[a.slug] })),
      ...(noApparatus > 0 ? [{ slug: "none", label: "Seçilmemiş", count: noApparatus }] : []),
    ],
    clubs: clubList.slice(0, 8),
    clubCount: clubList.length,
    discountTotal: Math.round(discountTotal),
    discountedRecords,
    records: reservations.length + orders.length,
  });
};
