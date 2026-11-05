// Tablo listeleme için sayfalama + arama parametrelerini parse eder.
export const parsePaginationQuery = (req) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const status = req.query.status;
  const search = req.query.search
    ? String(req.query.search).trim().slice(0, 100)
    : undefined;
  // Tek kayıt (admin linkle detay açma: ?id=...) — aynı admin biçimiyle döner
  const id = req.query.id ? String(req.query.id).trim().slice(0, 64) : undefined;

  return { page, limit, skip: (page - 1) * limit, status, search, id };
};

// "2026-11-05" → o günün başı / sonu, Türkiye saatiyle (UTC+3, yaz saati yok).
// Sunucu UTC'de çalıştığı için saat dilimi açıkça yazılır. Geçersizse undefined.
const parseDay = (value, endOfDay) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return undefined;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00"}+03:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

// Order/Reservation tablolarında ortak filtreyi (status + sporcu/kulüp/tel/e-posta arama,
// isteğe bağlı oluşturma tarihi aralığı, tek kayıt id'si) Prisma where clause'una çevirir.
export const buildCustomerSearchWhere = ({ status, search, id, from, to }) => {
  const where = {};
  if (id) where.id = id;
  if (status && status !== "all") {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { athleteName: { contains: search, mode: "insensitive" } },
      { clubName: { contains: search, mode: "insensitive" } },
      { customerPhone: { contains: search } },
      { customerEmail: { contains: search, mode: "insensitive" } },
    ];
  }
  const gte = parseDay(from, false);
  const lte = parseDay(to, true);
  if (gte || lte) where.createdAt = { ...(gte && { gte }), ...(lte && { lte }) };
  return where;
};

/**
 * ?sort=alan&dir=asc|desc → Prisma orderBy. Yalnızca izin verilen alanlar;
 * bilinmeyen değer varsayılana düşer (eşit değerlerde sıra sabit kalsın diye id eklenir).
 */
export const parseSort = (req, allowed, fallback = { createdAt: "desc" }) => {
  const field = String(req.query.sort || "");
  const dir = req.query.dir === "asc" ? "asc" : "desc";
  if (!allowed.includes(field)) return [fallback, { id: "desc" }];
  return [{ [field]: dir }, { id: "desc" }];
};
