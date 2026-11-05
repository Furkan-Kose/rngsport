import prisma from "../lib/prisma.js";
import { shootingListChecker } from "./names.js";
import { buildCustomerSearchWhere, parseSort } from "./pagination.js";
import { buildXlsx, columnList, pickColumns, recordColumns, sendXlsx } from "./excel.js";

// Bir dosyada en fazla bu kadar satır (bellek + Railway süresi için güvenli sınır)
const MAX_EXPORT_ROWS = 5000;
const SORT_FIELDS = ["createdAt", "totalPrice", "athleteName", "clubName", "status"];

const CONFIG = {
  order: { columns: () => recordColumns({ withPaymentId: true }), sheet: "Paket Siparişleri", file: "paket-siparisleri" },
  reservation: { columns: () => recordColumns(), sheet: "Rezervasyonlar", file: "rezervasyonlar" },
};

/** GET /api/{orders|reservations}/export/columns */
export const exportColumnsHandler = (kind) => (req, res) => {
  res.json({ columns: columnList(CONFIG[kind].columns()) });
};

/**
 * GET /api/{orders|reservations}/export?status=&search=&from=&to=&sort=&dir=&columns=a,b
 * Listedeki filtrelerin aynısı + tarih aralığı. Sıra listedekiyle aynı.
 */
export const exportRecordsHandler = (kind) => async (req, res) => {
  const config = CONFIG[kind];
  const where = buildCustomerSearchWhere({
    status: req.query.status ? String(req.query.status) : undefined,
    search: req.query.search ? String(req.query.search).trim().slice(0, 100) : undefined,
    from: req.query.from,
    to: req.query.to,
  });
  const [records, checkList] = await Promise.all([
    prisma[kind].findMany({
      where,
      include: { items: true },
      orderBy: parseSort(req, SORT_FIELDS),
      take: MAX_EXPORT_ROWS,
    }),
    shootingListChecker(),
  ]);
  const rows = records.map((r) => ({ ...r, ...checkList(r) }));
  const columns = pickColumns(config.columns(), req.query.columns);
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" }); // 2026-11-05
  sendXlsx(res, buildXlsx(rows, columns, config.sheet), `${config.file}-${today}.xlsx`);
};
