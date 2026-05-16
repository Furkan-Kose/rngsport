// Tablo listeleme için sayfalama + arama parametrelerini parse eder.
export const parsePaginationQuery = (req) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const status = req.query.status;
  const search = req.query.search
    ? String(req.query.search).trim().slice(0, 100)
    : undefined;

  return { page, limit, skip: (page - 1) * limit, status, search };
};

// Order/Reservation tablolarında ortak filtreyi (status + sporcu/kulüp/tel arama)
// Prisma where clause'una çevirir.
export const buildCustomerSearchWhere = ({ status, search }) => {
  const where = {};
  if (status && status !== "all") {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { athleteName: { contains: search, mode: "insensitive" } },
      { clubName: { contains: search, mode: "insensitive" } },
      { customerPhone: { contains: search } },
    ];
  }
  return where;
};
