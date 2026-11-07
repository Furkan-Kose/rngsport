/**
 * Bir kerelik: yarışma bazlı yapıya geçişte eski kayıtları yarışmalarına bağlar.
 *
 *   node scripts/backfill-tournament.js            → yalnızca rapor (hiçbir şey yazmaz)
 *   node scripts/backfill-tournament.js --apply    → yazar
 *   node scripts/backfill-tournament.js --apply --open-next
 *       → ayrıca "III. International Ritmika Cup"ı rezervasyona açar (startDate 2027-02-11)
 *   node scripts/backfill-tournament.js --apply --to-next
 *       → yarışmasız kayıtları "III. International Ritmika Cup"a bağlar. Yeni kod yayına çıkmadan
 *         önce canlıdaki eski kodun yarışmasız kaydettiği rezervasyon/siparişler için (yayın sonrası
 *         bir kez çalıştırılır; 2026-11-07 backfill'i ile eskiler zaten etiketli).
 *
 * Yalnızca tournamentId'si BOŞ olan sipariş / rezervasyon / çekim günlerine dokunur; tekrar
 * çalıştırmak güvenlidir. Hiçbir kayıt silinmez. Önce/sonra sayıları yazdırır.
 */
import prisma from "../src/lib/prisma.js";

const PAST_NAME = "International Baby Games 2026";
const NEXT_NAME = "III. International Ritmika Cup";
const NEXT_START = new Date("2027-02-11T00:00:00+03:00");

const apply = process.argv.includes("--apply");
const openNext = process.argv.includes("--open-next");
const toNext = process.argv.includes("--to-next");

const snapshot = async () => ({
  orders: await prisma.order.count(),
  ordersNoTournament: await prisma.order.count({ where: { tournamentId: null } }),
  reservations: await prisma.reservation.count(),
  reservationsNoTournament: await prisma.reservation.count({ where: { tournamentId: null } }),
  shootingDays: await prisma.shootingDay.count(),
  daysNoTournament: await prisma.shootingDay.count({ where: { tournamentId: null } }),
  shootingEntries: await prisma.shootingListEntry.count(),
  orderItems: await prisma.orderItem.count(),
  reservationItems: await prisma.reservationItem.count(),
  pointTransactions: await prisma.pointTransaction.count(),
});

const findOne = async (name) => {
  const rows = await prisma.tournament.findMany({ where: { name } });
  if (rows.length !== 1) throw new Error(`"${name}" adlı tam olarak bir yarışma bekleniyordu, bulunan: ${rows.length}`);
  return rows[0];
};

const main = async () => {
  const past = await findOne(toNext ? NEXT_NAME : PAST_NAME);
  console.log(`Yarışmasız kayıtlar bağlanacak: ${past.name} (${past.id})`);
  const before = await snapshot();
  console.log("ÖNCE ", before);

  if (!apply) {
    console.log("\nRapor modu: hiçbir şey yazılmadı. Yazmak için --apply ekleyin.");
    return;
  }

  const data = { tournamentId: past.id };
  const onlyEmpty = { where: { tournamentId: null }, data };
  const [o, r, d] = await prisma.$transaction([
    prisma.order.updateMany(onlyEmpty),
    prisma.reservation.updateMany(onlyEmpty),
    prisma.shootingDay.updateMany(onlyEmpty),
  ]);
  console.log(`\nGüncellenen: ${o.count} sipariş, ${r.count} rezervasyon, ${d.count} çekim günü`);

  if (openNext) {
    const next = await findOne(NEXT_NAME);
    await prisma.tournament.update({
      where: { id: next.id },
      data: { bookingOpen: true, startDate: next.startDate ?? NEXT_START },
    });
    console.log(`Rezervasyona açıldı: ${next.name}`);
  }

  const after = await snapshot();
  console.log("SONRA", after);
  const same = ["orders", "reservations", "shootingDays", "shootingEntries", "orderItems", "reservationItems", "pointTransactions"]
    .every((k) => before[k] === after[k]);
  console.log(same ? "\n✓ Kayıt sayıları aynı (hiçbir şey silinmedi)" : "\n✗ SAYILAR DEĞİŞTİ — kontrol edin!");
};

main()
  .catch((err) => {
    console.error(err.message || err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
