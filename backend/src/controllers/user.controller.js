import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import { AppError, rethrowPrismaError } from "../utils/errors.js";
import { ROLES, PANEL_ACCOUNT_ROLES } from "../utils/roles.js";
import {
  validateClubName,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePhone,
  validateUsername,
  sanitizeBirthYear,
} from "../utils/validators.js";
import { deleteObject } from "../lib/r2.js";
import { issueSetPasswordToken } from "../utils/customerAccount.js";
import { sendPasswordResetEmail } from "../lib/mail.js";

// Müşteri satırı. password ASLA doğrudan dönmez — yalnızca hasPassword'e çevrilir.
// (false = hesap sipariş/rezervasyonla otomatik açıldı, müşteri henüz sahiplenmedi)
const customerSelect = {
  id: true,
  name: true,
  clubName: true,
  birthYear: true,
  email: true,
  phone: true,
  createdAt: true,
  emailVerifiedAt: true,
  password: true,
};

const formatCustomer = ({ password, emailVerifiedAt, ...user }) => ({
  ...user,
  emailVerified: !!emailVerifiedAt,
  hasPassword: password !== null,
});

// /staff uçlarındaki findStaffOrThrow'un eşleniği: bu uçlar SADECE müşteri
// hesaplarında çalışır, admin/personel buradan düzenlenip silinemez.
const findCustomerOrThrow = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, password: true, role: true },
  });
  if (!user || user.role !== ROLES.CUSTOMER) {
    throw new AppError("Müşteri bulunamadı", 404);
  }
  return user;
};

// Admin: müşteri listesi (arama + sayfalama)
export const getAllUsers = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const search = req.query.search
    ? String(req.query.search).trim().slice(0, 100)
    : undefined;

  const where = {
    role: ROLES.CUSTOMER,
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
        ...customerSelect,
        _count: { select: { photos: true, reservations: true, orders: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    data: users.map(formatCustomer),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

// Admin: müşteri sekmesinin özet kartları
export const getCustomerStats = async (_req, res) => {
  const base = { role: ROLES.CUSTOMER };

  const [total, withoutPassword, unverified, withPhotos] = await Promise.all([
    prisma.user.count({ where: base }),
    // Hesabı otomatik açılmış ama müşteri hiç şifre belirlememiş
    prisma.user.count({ where: { ...base, password: null } }),
    prisma.user.count({ where: { ...base, emailVerifiedAt: null } }),
    prisma.user.count({ where: { ...base, photos: { some: {} } } }),
  ]);

  res.json({ total, withoutPassword, unverified, withPhotos });
};

// Admin: tek kullanıcı detayı. Galeri sayfasının başlığı ve müşteri detay
// sayfası aynı ucu kullanır; detay sayfası tek istekle dolsun diye sipariş,
// rezervasyon ve galeri özeti de burada döner.
const detailRecordInclude = {
  include: { items: true },
  orderBy: { createdAt: "desc" },
};

export const getUser = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      ...customerSelect,
      role: true,
      _count: { select: { photos: true, reservations: true, orders: true } },
      orders: detailRecordInclude,
      reservations: detailRecordInclude,
    },
  });

  if (!user) {
    throw new AppError("Kullanıcı bulunamadı", 404);
  }

  // Albüm listesi (galeri özeti için) — foto yoksa sorguyu hiç atma
  const albums = user._count.photos
    ? await prisma.galleryPhoto.findMany({
        where: { userId: user.id, album: { not: null } },
        select: { album: true },
        distinct: ["album"],
        orderBy: { album: "asc" },
      })
    : [];

  res.json({
    user: {
      ...formatCustomer(user),
      albums: albums.map((a) => a.album),
    },
  });
};

// --- Müşteri yönetimi ---
// Bu uçlar findCustomerOrThrow ile korunuyor: admin/personel hesaplarına dokunmaz.

// Admin: elle müşteri ekle. Şifresiz açılır (password: null) — müşteri şifresini
// "şifre belirleme" linkiyle kendisi koyar, admin hiçbir zaman şifre görmez.
export const createCustomer = async (req, res) => {
  const name = validateFullName(req.body.name);
  const email = validateEmail(req.body.email);
  const phone = req.body.phone ? validatePhone(req.body.phone) : null;
  const clubName = req.body.clubName ? validateClubName(req.body.clubName) : null;
  const birthYear = req.body.birthYear ? sanitizeBirthYear(req.body.birthYear) : null;
  // null = müşteri şifresini sonra kendisi belirler (şifre linki / başarı ekranı)
  const password = req.body.password
    ? await bcrypt.hash(validatePassword(req.body.password), 10)
    : null;

  const user = await prisma.user
    .create({
      data: { name, clubName, birthYear, email, phone, password, role: ROLES.CUSTOMER },
      select: customerSelect,
    })
    .catch(
      rethrowPrismaError({ duplicate: "Bu e-posta ile kayıtlı bir hesap var" }),
    );

  res.status(201).json({
    message: "Müşteri oluşturuldu",
    user: formatCustomer(user),
  });
};

export const updateCustomer = async (req, res) => {
  const { id } = req.params;
  const existing = await findCustomerOrThrow(id);

  const data = {};
  if (req.body.name !== undefined) data.name = validateFullName(req.body.name);
  if (req.body.phone !== undefined) {
    data.phone = req.body.phone ? validatePhone(req.body.phone) : null;
  }
  if (req.body.clubName !== undefined) {
    data.clubName = req.body.clubName ? validateClubName(req.body.clubName) : null;
  }
  if (req.body.birthYear !== undefined) {
    data.birthYear = req.body.birthYear ? sanitizeBirthYear(req.body.birthYear) : null;
  }
  if (req.body.email !== undefined) {
    data.email = validateEmail(req.body.email);
    // Adres değiştiyse doğrulama sıfırlanır — yeni adres kanıtlanmış değil
    if (data.email !== existing.email) data.emailVerifiedAt = null;
  }
  // Boş şifre = değiştirme. Müşteri e-postasına erişemediğinde admin elle belirleyebilsin.
  // emailVerifiedAt'e dokunulmaz: admin'in şifre yazması e-posta sahipliğini kanıtlamaz.
  if (req.body.password) {
    data.password = await bcrypt.hash(validatePassword(req.body.password), 10);
  }

  if (Object.keys(data).length === 0) {
    throw new AppError("Güncellenecek alan yok", 400);
  }

  const user = await prisma.user
    .update({ where: { id }, data, select: customerSelect })
    .catch(
      rethrowPrismaError({
        duplicate: "Bu e-posta ile kayıtlı başka bir hesap var",
        notFound: "Müşteri bulunamadı",
      }),
    );

  res.json({ message: "Müşteri güncellendi", user: formatCustomer(user) });
};

// Admin: müşteri sil.
// Şemadaki davranış: GalleryPhoto → Cascade (foto kayıtları silinir),
// Order/Reservation → SetNull (kayıtlar durur, hesap bağı kopar).
// R2'deki dosyalar cascade'e dahil olmadığı için burada elle temizlenir.
export const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  await findCustomerOrThrow(id);

  const photos = await prisma.galleryPhoto.findMany({
    where: { userId: id },
    select: { r2Key: true },
  });

  await prisma.user
    .delete({ where: { id } })
    .catch(rethrowPrismaError({ notFound: "Müşteri bulunamadı" }));

  // Fire-and-forget: R2 temizliği silme işlemini bloklamasın ya da bozmasın
  for (const photo of photos) {
    deleteObject(photo.r2Key).catch((err) =>
      console.error(`Galeri dosyası silinemedi (${photo.r2Key}):`, err),
    );
  }

  res.json({ message: "Müşteri silindi", deletedPhotos: photos.length });
};

// Admin: müşteriye şifre belirleme/sıfırlama linki gönderir.
// Token 7 gün geçerli (issueSetPasswordToken); admin şifreyi hiç görmez.
export const sendSetPasswordLink = async (req, res) => {
  const user = await findCustomerOrThrow(req.params.id);

  if (!user.email) {
    throw new AppError("Bu hesapta e-posta adresi yok", 400);
  }

  const token = await issueSetPasswordToken(user.id);
  if (!token) {
    throw new AppError("Bağlantı oluşturulamadı, tekrar deneyin", 500);
  }

  sendPasswordResetEmail(user.email, user.name, token, {
    isFirstTime: !user.password,
  });

  res.json({
    message: user.password
      ? "Şifre sıfırlama bağlantısı gönderildi"
      : "Şifre belirleme bağlantısı gönderildi",
  });
};

// --- Panel hesapları (admin / fotografci / videocu) ---
// Bu uçlar PANEL_ACCOUNT_ROLES üzerinde çalışır; müşteri hesaplarına dokunmaz.
// Kendi hesabını silmek ve son admin'i silmek/düşürmek yasak — aksi halde
// panele kimse giremez hale gelir.

const staffSelect = {
  id: true,
  username: true,
  name: true,
  role: true,
  createdAt: true,
};

const validateStaffRole = (role) => {
  if (!PANEL_ACCOUNT_ROLES.includes(role)) {
    throw new AppError("Geçersiz personel rolü", 400);
  }
  return role;
};

const findStaffOrThrow = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  if (!user || !PANEL_ACCOUNT_ROLES.includes(user.role)) {
    throw new AppError("Personel bulunamadı", 404);
  }
  return user;
};

const assertNotLastAdmin = async () => {
  const adminCount = await prisma.user.count({ where: { role: ROLES.ADMIN } });
  if (adminCount <= 1) {
    throw new AppError("Son yönetici hesabı silinemez veya yetkisi alınamaz", 400);
  }
};

export const getStaff = async (_req, res) => {
  const data = await prisma.user.findMany({
    where: { role: { in: PANEL_ACCOUNT_ROLES } },
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
  const target = await findStaffOrThrow(id);

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

  // Bir admin'in yetkisi alınıyorsa
  if (target.role === ROLES.ADMIN && data.role && data.role !== ROLES.ADMIN) {
    if (id === req.user.id) {
      throw new AppError("Kendi yönetici yetkinizi kaldıramazsınız", 400);
    }
    await assertNotLastAdmin();
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
  if (id === req.user.id) {
    throw new AppError("Kendi hesabınızı silemezsiniz", 400);
  }
  const target = await findStaffOrThrow(id);
  if (target.role === ROLES.ADMIN) await assertNotLastAdmin();

  await prisma.user
    .delete({ where: { id } })
    .catch(rethrowPrismaError({ notFound: "Personel bulunamadı" }));
  res.json({ message: "Personel silindi" });
};
