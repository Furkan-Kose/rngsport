import prisma from "../lib/prisma.js";
import { AppError, rethrowPrismaError } from "../utils/errors.js";

const PACKAGE_NOT_FOUND = { notFound: "Paket bulunamadı" };
const PACKAGE_DUPLICATE = { duplicate: "Bu slug zaten kullanılıyor" };

// Public response: frontend'in beklediği format
const formatPackagePublic = (pkg) => ({
  id: pkg.slug,
  category: pkg.category,
  name: pkg.name,
  price: pkg.price,
  image: pkg.image,
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
const formatPackageAdmin = (pkg) => ({
  id: pkg.id,
  slug: pkg.slug,
  category: pkg.category,
  name: pkg.name,
  price: pkg.price,
  image: pkg.image,
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

  res.status(201).json({ message: "Paket oluşturuldu", package: pkg });
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

  res.json({ message: "Paket güncellendi", package: pkg });
};

// Paket sil (admin)
export const deletePackage = async (req, res) => {
  await prisma.package
    .delete({ where: { id: req.params.id } })
    .catch(rethrowPrismaError(PACKAGE_NOT_FOUND));

  res.json({ message: "Paket silindi" });
};
