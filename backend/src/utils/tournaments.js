import prisma from "../lib/prisma.js";
import { AppError } from "./errors.js";
import { localize } from "./i18n.js";

/**
 * Yarışma (Tournament) bazlı rezervasyon / sipariş.
 *
 * Her paket siparişi, rezervasyon ve çekim günü bir yarışmaya bağlıdır (`tournamentId`).
 * Eski kayıtlar silinmez; yarışmalar listelerde ve çekim listesi eşleşmesinde birbirinden ayrılır.
 * Müşteri yalnızca "rezervasyona açık" (`bookingOpen`) bir yarışmaya kayıt olabilir; genelde tek
 * yarışma açıktır. Hiç açık yarışma yoksa rezervasyon ve online sipariş kapalıdır.
 */

export const NO_OPEN_TOURNAMENT = "Şu an rezervasyona açık yarışma yok";
export const CHOOSE_TOURNAMENT = "Lütfen yarışma seçin";

const NAME_FIELDS = ["name", "date", "location"];

/** Müşteriye / maile gidecek kısa yarışma bilgisi (istek dilinde) */
export const tournamentView = (t, locale) => {
  if (!t) return null;
  const l = localize(t, locale, NAME_FIELDS);
  return { id: t.id, name: l.name, date: l.date, location: l.location };
};

export const tournamentInclude = {
  tournament: { select: { id: true, name: true, date: true, location: true, translations: true } },
};

/** Rezervasyona açık yarışmalar (en yakın tarih önce) */
export const openTournaments = () =>
  prisma.tournament.findMany({
    where: { bookingOpen: true },
    orderBy: [{ startDate: { sort: "asc", nulls: "last" } }, { sortOrder: "asc" }],
  });

/**
 * Yeni rezervasyon / sipariş hangi yarışmaya bağlanacak?
 * - Müşteri: istediği yarışma açık olmalı; seçim yoksa tek açık yarışma otomatik seçilir.
 *   Birden çok açıksa seçim zorunlu, hiç açık yoksa kayıt alınmaz.
 * - Admin: kapalı (geçmiş) bir yarışmayı da seçebilir; seçmezse açık yarışma kullanılır.
 */
export const resolveBookingTournament = async (requestedId, { admin = false } = {}) => {
  const id = requestedId ? String(requestedId) : null;
  if (id) {
    const t = await prisma.tournament.findUnique({ where: { id } });
    if (!t) throw new AppError("Yarışma bulunamadı", 404);
    if (!t.bookingOpen && !admin) throw new AppError(NO_OPEN_TOURNAMENT, 400);
    return t;
  }
  const open = await openTournaments();
  if (open.length === 1) return open[0];
  if (open.length > 1) throw new AppError(CHOOSE_TOURNAMENT, 400);
  throw new AppError(admin ? CHOOSE_TOURNAMENT : NO_OPEN_TOURNAMENT, 400);
};

/**
 * Admin listelerinin varsayılan yarışması: açık yarışma; yoksa kaydı olan en yeni yarışma.
 * Hiç yarışma yoksa null (= tümü).
 */
export const defaultAdminTournamentId = async () => {
  const open = await openTournaments();
  if (open.length) return open[0].id;
  const latest = await prisma.reservation.findFirst({
    where: { tournamentId: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { tournamentId: true },
  });
  return latest?.tournamentId ?? null;
};

/**
 * ?tournamentId= → Prisma where parçası. "all" ya da boş → filtre yok.
 * (Admin istemcisi varsayılanı kendisi seçip gönderir; sunucu boşu "tümü" sayar.)
 */
export const tournamentWhere = (value) => {
  if (!value || value === "all") return {};
  if (value === "none") return { tournamentId: null };
  return { tournamentId: String(value) };
};
