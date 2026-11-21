/**
 * Bir kerelik: eski sitenin veritabanındaki "International Ritmika Cup 2026" rezervasyon ve
 * siparişlerini bu veritabanına, o yarışmanın altına aktarır.
 *
 *   OLD_DB_URL=postgresql://... node scripts/import-ritmika-cup-2026.js           → yalnızca rapor
 *   OLD_DB_URL=postgresql://... node scripts/import-ritmika-cup-2026.js --apply   → yazar
 *
 * Eski DB'nin adresi dosyaya yazılmaz, yalnızca ortam değişkeniyle verilir; eski DB yalnızca OKUNUR.
 * Kurallar (kullanıcı kararı, 2026-11-08):
 *  - Yalnızca yeni kayıt eklenir; mevcut hiçbir satır güncellenmez ya da silinmez. Aynı id zaten
 *    varsa atlanır (tekrar çalıştırmak güvenli).
 *  - Durumlar olduğu gibi kalır; id, tutar, not ve tarihler korunur.
 *  - Puan yazılmaz (points 0, PointTransaction yok); alet / öncelik bilgisi eski sistemde yok.
 *  - E-posta şimdiki bir müşteri hesabına aitse userId bağlanır; yeni hesap açılmaz.
 *  - Mail, SSE, puan senkronu tetiklenmez (doğrudan Prisma, tek transaction).
 */
import { PrismaClient } from "@prisma/client";
import prisma from "../src/lib/prisma.js";
import { ROLES } from "../src/utils/roles.js";

const TOURNAMENT_NAME = "International Ritmika Cup 2026";
const apply = process.argv.includes("--apply");

if (!process.env.OLD_DB_URL) {
  console.error("OLD_DB_URL ortam değişkeni gerekli (eski veritabanının public adresi).");
  process.exit(1);
}
const oldDb = new PrismaClient({ datasources: { db: { url: process.env.OLD_DB_URL } } });
const q = (sql) => oldDb.$queryRawUnsafe(sql);

const counts = async () => ({
  reservations: await prisma.reservation.count(),
  reservationItems: await prisma.reservationItem.count(),
  orders: await prisma.order.count(),
  orderItems: await prisma.orderItem.count(),
  users: await prisma.user.count(),
  pointTransactions: await prisma.pointTransaction.count(),
  shootingEntries: await prisma.shootingListEntry.count(),
});

const ITEM_FIELDS = (i) => ({
  id: i.id,
  packageId: i.packageId,
  packageName: i.packageName,
  category: i.category,
  price: i.price,
  seriesCount: i.seriesCount,
  quantity: i.quantity,
});

const main = async () => {
  const tournaments = await prisma.tournament.findMany({ where: { name: TOURNAMENT_NAME } });
  if (tournaments.length !== 1) throw new Error(`"${TOURNAMENT_NAME}" tam olarak bir kez bulunmalı (${tournaments.length})`);
  const tournament = tournaments[0];

  // Eski veriler (yalnızca SELECT)
  const [oldRes, oldResItems, oldOrd, oldOrdItems] = await Promise.all([
    q(`SELECT id, "athleteName", "clubName", "birthYear", "customerPhone", "customerEmail", notes, "totalPrice", status::text AS status, "createdAt", "updatedAt" FROM reservations`),
    q(`SELECT id, "reservationId", "packageId", "packageName", category, price, "seriesCount", quantity FROM reservation_items`),
    q(`SELECT id, "athleteName", "clubName", "birthYear", "customerPhone", "customerEmail", notes, "totalPrice", status::text AS status, "paymentId", "conversationId", "createdAt", "updatedAt" FROM orders`),
    q(`SELECT id, "orderId", "packageId", "packageName", category, price, "seriesCount", quantity FROM order_items`),
  ]);

  // Daha önce aktarılmışları atla
  const [haveRes, haveOrd, haveResItems, haveOrdItems] = await Promise.all([
    prisma.reservation.findMany({ where: { id: { in: oldRes.map((r) => r.id) } }, select: { id: true } }),
    prisma.order.findMany({ where: { id: { in: oldOrd.map((r) => r.id) } }, select: { id: true } }),
    prisma.reservationItem.findMany({ where: { id: { in: oldResItems.map((r) => r.id) } }, select: { id: true } }),
    prisma.orderItem.findMany({ where: { id: { in: oldOrdItems.map((r) => r.id) } }, select: { id: true } }),
  ]);
  const skip = new Set([...haveRes, ...haveOrd, ...haveResItems, ...haveOrdItems].map((r) => r.id));

  // E-postası şimdiki bir müşteri hesabına ait olanlar bağlanır
  const emails = [...new Set([...oldRes, ...oldOrd].map((r) => r.customerEmail?.trim().toLowerCase()).filter(Boolean))];
  const customers = await prisma.user.findMany({
    where: { email: { in: emails }, role: ROLES.CUSTOMER },
    select: { id: true, email: true },
  });
  const userByEmail = new Map(customers.map((u) => [u.email, u.id]));
  const userFor = (email) => userByEmail.get(email?.trim().toLowerCase()) ?? null;

  const reservations = oldRes
    .filter((r) => !skip.has(r.id))
    .map((r) => ({
      id: r.id,
      athleteName: r.athleteName,
      clubName: r.clubName,
      birthYear: r.birthYear,
      customerPhone: r.customerPhone,
      customerEmail: r.customerEmail,
      notes: r.notes,
      totalPrice: r.totalPrice,
      status: r.status,
      locale: "tr",
      tournamentId: tournament.id,
      userId: userFor(r.customerEmail),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  const reservationItems = oldResItems
    .filter((i) => !skip.has(i.id))
    .map((i) => ({ ...ITEM_FIELDS(i), reservationId: i.reservationId }));
  const orders = oldOrd
    .filter((o) => !skip.has(o.id))
    .map((o) => ({
      id: o.id,
      athleteName: o.athleteName,
      clubName: o.clubName,
      birthYear: o.birthYear,
      customerPhone: o.customerPhone,
      customerEmail: o.customerEmail,
      notes: o.notes,
      totalPrice: o.totalPrice,
      status: o.status,
      paymentId: o.paymentId,
      conversationId: o.conversationId,
      locale: "tr",
      tournamentId: tournament.id,
      userId: userFor(o.customerEmail),
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }));
  const orderItems = oldOrdItems.filter((i) => !skip.has(i.id)).map((i) => ({ ...ITEM_FIELDS(i), orderId: i.orderId }));

  const by = (rows) => rows.reduce((a, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a), {});
  const sum = (rows) => rows.reduce((a, r) => a + r.totalPrice, 0);
  console.log(`Hedef yarışma: ${tournament.name} (${tournament.id})`);
  console.log("Eski DB:", { reservations: oldRes.length, reservationItems: oldResItems.length, orders: oldOrd.length, orderItems: oldOrdItems.length });
  console.log("Eklenecek:", {
    reservations: reservations.length,
    reservationItems: reservationItems.length,
    orders: orders.length,
    orderItems: orderItems.length,
  });
  console.log("Zaten var (atlanacak):", skip.size);
  console.log("Rezervasyon durumları:", by(reservations), "toplam ₺", sum(reservations));
  console.log("Sipariş durumları:", by(orders), "toplam ₺", sum(orders));
  console.log("Müşteri hesabına bağlanacak:", reservations.filter((r) => r.userId).length, "rezervasyon,", orders.filter((o) => o.userId).length, "sipariş");

  const before = await counts();
  console.log("ÖNCE ", before);
  if (!apply) {
    console.log("\nRapor modu: hiçbir şey yazılmadı. Yazmak için --apply ekleyin.");
    return;
  }

  // Tek transaction: bir hata olursa hiçbir şey yazılmaz
  await prisma.$transaction([
    prisma.reservation.createMany({ data: reservations }),
    prisma.reservationItem.createMany({ data: reservationItems }),
    prisma.order.createMany({ data: orders }),
    prisma.orderItem.createMany({ data: orderItems }),
  ]);

  const after = await counts();
  console.log("SONRA", after);
  const expected = {
    reservations: before.reservations + reservations.length,
    reservationItems: before.reservationItems + reservationItems.length,
    orders: before.orders + orders.length,
    orderItems: before.orderItems + orderItems.length,
    users: before.users,
    pointTransactions: before.pointTransactions,
    shootingEntries: before.shootingEntries,
  };
  const ok = Object.keys(expected).every((k) => expected[k] === after[k]);
  console.log(ok ? "\n✓ Sayılar beklendiği gibi (yalnızca eklenenler kadar arttı)" : "\n✗ SAYILAR BEKLENENDEN FARKLI — kontrol edin!", ok ? "" : expected);
};

main()
  .catch((err) => {
    console.error("Aktarım başarısız, hiçbir şey yazılmadı:", err.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await oldDb.$disconnect();
    await prisma.$disconnect();
  });
