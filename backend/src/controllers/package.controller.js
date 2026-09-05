import crypto from "node:crypto";
import prisma from "../lib/prisma.js";
import { AppError, rethrowPrismaError } from "../utils/errors.js";
import { presignUpload, getObject, deleteObject } from "../lib/r2.js";

const PACKAGE_NOT_FOUND = { notFound: "Paket bulunamadı" };
const PACKAGE_DUPLICATE = { duplicate: "Bu slug zaten kullanılıyor" };

const R2_IMAGE_PREFIX = "paketler/";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const IMAGE_EXTENSIONS = new Set(["webp", "jpg", "jpeg", "png"]);
// Sadece paketler/ klasöründeki uuid'li dosya adları — users/ galerisine erişimi keser
const IMAGE_FILE_REGEX = /^[a-z0-9-]+\.(webp|jpe?g|png)$/;

// paketler/ key'lerini sabit proxy URL'sine çevirir; eski /packages/*.webp
// ve harici URL'ler olduğu gibi geçer (geriye uyumluluk).
const resolveImage = (image) => {
  if (image?.startsWith(R2_IMAGE_PREFIX)) {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
    return `${backendUrl}/api/packages/image/${image.slice(R2_IMAGE_PREFIX.length)}`;
  }
  return image;
};

// Public response: frontend'in beklediği format
const formatPackagePublic = (pkg) => ({
  id: pkg.slug,
  category: pkg.category,
  name: pkg.name,
  price: pkg.price,
  image: resolveImage(pkg.image),
  features: pkg.features,
  discounts: {
    2: pkg.discount2,
    3: pkg.discount3,
  },
  // Rezervasyon fiyatları (null ise normal fiyatlar kullanılır)
  reservationPrice: pkg.reservationPrice ?? pkg.price,
  reservationDiscounts: {
    2: pkg.reservationDiscount2 ?? pkg.discount2,
    3: pkg.reservationDiscount3 ?? pkg.discount3,
  },
});

// Admin response: tüm alanlar (pasifler dahil)
// image ham değerdir (form state için); imageUrl önizleme/liste için çözülmüş URL
const formatPackageAdmin = (pkg) => ({
  id: pkg.id,
  slug: pkg.slug,
  category: pkg.category,
  name: pkg.name,
  price: pkg.price,
  image: pkg.image,
  imageUrl: resolveImage(pkg.image),
  features: pkg.features,
  discount2: pkg.discount2,
  discount3: pkg.discount3,
  reservationPrice: pkg.reservationPrice,
  reservationDiscount2: pkg.reservationDiscount2,
  reservationDiscount3: pkg.reservationDiscount3,
  isActive: pkg.isActive,
  sortOrder: pkg.sortOrder,
  createdAt: pkg.createdAt,
  updatedAt: pkg.updatedAt,
});

// Tüm paketleri getir (sadece aktif olanlar - public)
export const getAllPackages = async (req, res) => {
  const packages = await prisma.package.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  res.json(packages.map(formatPackagePublic));
};

// Admin için tüm paketleri getir (pasif dahil)
export const getAllPackagesAdmin = async (req, res) => {
  const packages = await prisma.package.findMany({
    orderBy: { sortOrder: "asc" },
  });

  res.json(packages.map(formatPackageAdmin));
};

// Tek paket getir
export const getPackage = async (req, res) => {
  const { id } = req.params;

  const pkg = await prisma.package.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      isActive: true,
    },
  });

  if (!pkg) {
    throw new AppError("Paket bulunamadı", 404);
  }

  res.json(formatPackagePublic(pkg));
};

// Yeni paket oluştur (admin)
export const createPackage = async (req, res) => {
  const {
    slug,
    name,
    category,
    price,
    image,
    features,
    discount2,
    discount3,
    reservationPrice,
    reservationDiscount2,
    reservationDiscount3,
    sortOrder,
  } = req.body;

  if (!slug || !name || !category || !price) {
    throw new AppError("Zorunlu alanlar eksik", 400);
  }

  const pkg = await prisma.package
    .create({
      data: {
        slug,
        name,
        category,
        price,
        image: image || "",
        features: features || [],
        discount2: discount2 || price * 1.8,
        discount3: discount3 || price * 2.7,
        // Rezervasyon fiyatları (opsiyonel - null ise normal fiyatlar kullanılır)
        reservationPrice: reservationPrice || null,
        reservationDiscount2: reservationDiscount2 || null,
        reservationDiscount3: reservationDiscount3 || null,
        sortOrder: sortOrder || 0,
      },
    })
    .catch(rethrowPrismaError(PACKAGE_DUPLICATE));

  res.status(201).json({ message: "Paket oluşturuldu", package: formatPackageAdmin(pkg) });
};

// Paket güncelle (admin)
export const updatePackage = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    category,
    price,
    image,
    features,
    discount2,
    discount3,
    reservationPrice,
    reservationDiscount2,
    reservationDiscount3,
    isActive,
    sortOrder,
  } = req.body;

  // Görsel değişiyorsa eski R2 objesini temizlemek için mevcut değeri oku
  const existing = await prisma.package.findUnique({
    where: { id },
    select: { image: true },
  });
  if (!existing) {
    throw new AppError("Paket bulunamadı", 404);
  }

  const pkg = await prisma.package
    .update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(price && { price }),
        ...(image && { image }),
        ...(features && { features }),
        ...(discount2 && { discount2 }),
        ...(discount3 && { discount3 }),
        // Rezervasyon fiyatları (null yapılabilir)
        ...(reservationPrice !== undefined && { reservationPrice }),
        ...(reservationDiscount2 !== undefined && { reservationDiscount2 }),
        ...(reservationDiscount3 !== undefined && { reservationDiscount3 }),
        ...(typeof isActive === "boolean" && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    })
    .catch(rethrowPrismaError(PACKAGE_NOT_FOUND));

  // Görsel değiştiyse eski R2 objesini temizle (fire-and-forget)
  if (
    image &&
    image !== existing.image &&
    existing.image?.startsWith(R2_IMAGE_PREFIX)
  ) {
    deleteObject(existing.image).catch((err) =>
      console.error("Eski paket görseli silinemedi:", err)
    );
  }

  res.json({ message: "Paket güncellendi", package: formatPackageAdmin(pkg) });
};

// Paket sil (admin)
export const deletePackage = async (req, res) => {
  const pkg = await prisma.package
    .delete({ where: { id: req.params.id } })
    .catch(rethrowPrismaError(PACKAGE_NOT_FOUND));

  // R2'deki görseli de temizle (fire-and-forget — hata silmeyi engellemesin)
  if (pkg.image?.startsWith(R2_IMAGE_PREFIX)) {
    deleteObject(pkg.image).catch((err) =>
      console.error("Paket görseli silinemedi:", err)
    );
  }

  res.json({ message: "Paket silindi" });
};

// Admin: paket görseli için imzalı PUT URL'i üretir
export const presignPackageImage = async (req, res) => {
  const { fileName, contentType, size } = req.body;

  if (!fileName || !contentType) {
    throw new AppError("Dosya adı ve türü gerekli", 400);
  }
  if (!String(contentType).startsWith("image/")) {
    throw new AppError("Sadece görsel dosyası yüklenebilir", 400);
  }
  if (size && size > MAX_IMAGE_SIZE) {
    throw new AppError("Görsel 10MB'ı aşamaz", 400);
  }
  const ext = String(fileName).split(".").pop()?.toLowerCase();
  if (!IMAGE_EXTENSIONS.has(ext)) {
    throw new AppError("Desteklenmeyen dosya türü (webp/jpg/png)", 400);
  }

  const key = `${R2_IMAGE_PREFIX}${crypto.randomUUID()}.${ext}`;
  res.json({ key, uploadUrl: await presignUpload(key, contentType) });
};

// Public: paket görselini R2'den sabit URL ile servis eder (tarayıcı cache'ler)
export const servePackageImage = async (req, res) => {
  const { file } = req.params;

  if (!IMAGE_FILE_REGEX.test(file)) {
    throw new AppError("Görsel bulunamadı", 404);
  }

  try {
    const object = await getObject(`${R2_IMAGE_PREFIX}${file}`);
    res.setHeader("Content-Type", object.ContentType || "image/webp");
    if (object.ContentLength) {
      res.setHeader("Content-Length", object.ContentLength);
    }
    // Key'ler uuid olduğu için içerik hiç değişmez — güvenle immutable
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    object.Body.pipe(res);
  } catch (err) {
    if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) {
      throw new AppError("Görsel bulunamadı", 404);
    }
    throw err;
  }
};
