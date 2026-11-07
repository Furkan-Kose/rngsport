import prisma from "../lib/prisma.js";
import { AppError, rethrowPrismaError } from "../utils/errors.js";
import { localize, sanitizeTranslations } from "../utils/i18n.js";

const TOURNAMENT_NOT_FOUND = { notFound: "Turnuva bulunamadı" };
const VALID_STATUSES = ["finished", "ongoing", "upcoming"];
const TEXT_FIELDS = ["name", "date", "location", "flagAlt"];
const TRANSLATION_FIELDS = { stringFields: TEXT_FIELDS };

// "2027-02-11" (gün) ya da ISO → Date; boş → null. Türkiye saatiyle gün başı.
const parseStartDate = (value) => {
  if (value === null || value === "") return null;
  const str = String(value).trim();
  const d = /^\d{4}-\d{2}-\d{2}$/.test(str) ? new Date(`${str}T00:00:00+03:00`) : new Date(str);
  if (Number.isNaN(d.getTime())) throw new AppError("Geçersiz başlangıç tarihi", 400);
  return d;
};

// Public: ana sayfa turnuva takvimi (admin listesi de bunu kullanır — Türkçe
// istekte alanlar olduğu gibi döner, `translations` form için yanında gelir)
export const getAllTournaments = async (req, res) => {
  const tournaments = await prisma.tournament.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  res.json(
    tournaments.map((t) => ({
      ...localize(t, req.locale, TEXT_FIELDS),
      translations: t.translations ?? {},
    }))
  );
};

// Admin: yeni turnuva
export const createTournament = async (req, res) => {
  const { name, date, location, flag, flagAlt, status, sortOrder, translations, bookingOpen, startDate } =
    req.body;

  if (!name || !date || !location) {
    throw new AppError("Zorunlu alanlar eksik", 400);
  }
  if (status && !VALID_STATUSES.includes(status)) {
    throw new AppError("Geçersiz turnuva durumu", 400);
  }

  const tournament = await prisma.tournament.create({
    data: {
      name: String(name).trim(),
      date: String(date).trim(),
      location: String(location).trim(),
      flag: flag || null,
      flagAlt: flagAlt || null,
      status: status || "upcoming",
      sortOrder: sortOrder || 0,
      bookingOpen: bookingOpen === true,
      startDate: startDate ? parseStartDate(startDate) : null,
      translations: sanitizeTranslations(translations, TRANSLATION_FIELDS) ?? {},
    },
  });

  res.status(201).json({ message: "Turnuva oluşturuldu", tournament });
};

// Admin: turnuva güncelle (kısmi)
export const updateTournament = async (req, res) => {
  const { name, date, location, flag, flagAlt, status, sortOrder, translations, bookingOpen, startDate } =
    req.body;

  if (status && !VALID_STATUSES.includes(status)) {
    throw new AppError("Geçersiz turnuva durumu", 400);
  }

  const tournament = await prisma.tournament
    .update({
      where: { id: req.params.id },
      data: {
        ...(name && { name: String(name).trim() }),
        ...(date && { date: String(date).trim() }),
        ...(location && { location: String(location).trim() }),
        // flag null'a çekilebilsin (bayrak kaldırılabilir)
        ...(flag !== undefined && { flag: flag || null }),
        ...(flagAlt !== undefined && { flagAlt: flagAlt || null }),
        ...(status && { status }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(bookingOpen !== undefined && { bookingOpen: bookingOpen === true }),
        ...(startDate !== undefined && { startDate: parseStartDate(startDate) }),
        ...(translations !== undefined && {
          translations: sanitizeTranslations(translations, TRANSLATION_FIELDS),
        }),
      },
    })
    .catch(rethrowPrismaError(TOURNAMENT_NOT_FOUND));

  res.json({ message: "Turnuva güncellendi", tournament });
};

// Admin: turnuva sil
export const deleteTournament = async (req, res) => {
  // Kaydı olan yarışma silinmez: rezervasyon/sipariş/çekim günleri yarışmasız kalırdı
  const counts = await prisma.tournament.findUnique({
    where: { id: req.params.id },
    select: { _count: { select: { orders: true, reservations: true, shootingDays: true } } },
  });
  if (!counts) throw new AppError(TOURNAMENT_NOT_FOUND.notFound, 404);
  const { orders, reservations, shootingDays } = counts._count;
  if (orders + reservations + shootingDays > 0) {
    throw new AppError(
      `Bu yarışmaya bağlı ${reservations} rezervasyon, ${orders} sipariş ve ${shootingDays} çekim günü var. Silmek yerine durumunu "Tamamlandı" yapın.`,
      409
    );
  }
  await prisma.tournament
    .delete({ where: { id: req.params.id } })
    .catch(rethrowPrismaError(TOURNAMENT_NOT_FOUND));

  res.json({ message: "Turnuva silindi" });
};
