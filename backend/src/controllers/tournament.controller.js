import prisma from "../lib/prisma.js";
import { AppError, rethrowPrismaError } from "../utils/errors.js";

const TOURNAMENT_NOT_FOUND = { notFound: "Turnuva bulunamadı" };
const VALID_STATUSES = ["finished", "ongoing", "upcoming"];

// Public: ana sayfa turnuva takvimi
export const getAllTournaments = async (req, res) => {
  const tournaments = await prisma.tournament.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  res.json(tournaments);
};

// Admin: yeni turnuva
export const createTournament = async (req, res) => {
  const { name, date, location, flag, flagAlt, status, sortOrder } = req.body;

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
    },
  });

  res.status(201).json({ message: "Turnuva oluşturuldu", tournament });
};

// Admin: turnuva güncelle (kısmi)
export const updateTournament = async (req, res) => {
  const { name, date, location, flag, flagAlt, status, sortOrder } = req.body;

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
      },
    })
    .catch(rethrowPrismaError(TOURNAMENT_NOT_FOUND));

  res.json({ message: "Turnuva güncellendi", tournament });
};

// Admin: turnuva sil
export const deleteTournament = async (req, res) => {
  await prisma.tournament
    .delete({ where: { id: req.params.id } })
    .catch(rethrowPrismaError(TOURNAMENT_NOT_FOUND));

  res.json({ message: "Turnuva silindi" });
};
