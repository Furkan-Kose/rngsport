import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import { AppError, rethrowPrismaError } from "../utils/errors.js";
import { STAFF_ROLES } from "../utils/roles.js";
import {
  validateFullName,
  validatePassword,
  validateUsername,
} from "../utils/validators.js";

// Admin: müşteri listesi (arama + sayfalama)
export const getAllUsers = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const search = req.query.search
    ? String(req.query.search).trim().slice(0, 100)
    : undefined;

  const where = {
    role: "customer",
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ],
    }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: { select: { photos: true, reservations: true, orders: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    data: users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

// Admin: tek kullanıcı detayı (galeri sayfası başlığı için)
export const getUser = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      _count: { select: { photos: true, reservations: true, orders: true } },
    },
  });

  if (!user) {
    throw new AppError("Kullanıcı bulunamadı", 404);
  }

  res.json({ user });
};

// --- Saha personeli (fotografci / videocu) ---
// Bu uçlar sadece STAFF_ROLES üzerinde çalışır; admin hesapları buradan yönetilemez.

const staffSelect = {
  id: true,
  username: true,
  name: true,
  role: true,
  createdAt: true,
};

const validateStaffRole = (role) => {
  if (!STAFF_ROLES.includes(role)) {
    throw new AppError("Geçersiz personel rolü", 400);
  }
  return role;
};

const findStaffOrThrow = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  if (!user || !STAFF_ROLES.includes(user.role)) {
    throw new AppError("Personel bulunamadı", 404);
  }
  return user;
};

export const getStaff = async (_req, res) => {
  const data = await prisma.user.findMany({
    where: { role: { in: STAFF_ROLES } },
    select: staffSelect,
    orderBy: { createdAt: "desc" },
  });
  res.json({ data });
};

export const createStaff = async (req, res) => {
  const username = validateUsername(req.body.username);
  const name = validateFullName(req.body.name);
  const password = await bcrypt.hash(validatePassword(req.body.password), 10);
  const role = validateStaffRole(req.body.role);

  const user = await prisma.user
    .create({
      data: { username, name, password, role, email: null },
      select: staffSelect,
    })
    .catch(
      rethrowPrismaError({ duplicate: "Bu kullanıcı adı zaten kullanılıyor" }),
    );

  res.status(201).json({ message: "Personel oluşturuldu", user });
};

export const updateStaff = async (req, res) => {
  const { id } = req.params;
  await findStaffOrThrow(id);

  const data = {};
  if (req.body.username !== undefined) data.username = validateUsername(req.body.username);
  if (req.body.name !== undefined) data.name = validateFullName(req.body.name);
  if (req.body.role !== undefined) data.role = validateStaffRole(req.body.role);
  // Boş şifre = "değiştirme"
  if (req.body.password) {
    data.password = await bcrypt.hash(validatePassword(req.body.password), 10);
  }

  if (Object.keys(data).length === 0) {
    throw new AppError("Güncellenecek alan yok", 400);
  }

  const user = await prisma.user
    .update({ where: { id }, data, select: staffSelect })
    .catch(
      rethrowPrismaError({
        duplicate: "Bu kullanıcı adı zaten kullanılıyor",
        notFound: "Personel bulunamadı",
      }),
    );

  res.json({ message: "Personel güncellendi", user });
};

export const deleteStaff = async (req, res) => {
  const { id } = req.params;
  await findStaffOrThrow(id);
  await prisma.user
    .delete({ where: { id } })
    .catch(rethrowPrismaError({ notFound: "Personel bulunamadı" }));
  res.json({ message: "Personel silindi" });
};
