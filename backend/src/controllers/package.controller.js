import prisma from "../lib/prisma.js";

// Tüm paketleri getir (sadece aktif olanlar - public)
export const getAllPackages = async (req, res, next) => {
  try {
    const packages = await prisma.package.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    // Frontend'in beklediği formata dönüştür
    const formattedPackages = packages.map((pkg) => ({
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
    }));

    res.json(formattedPackages);
  } catch (error) {
    next(error);
  }
};

// Admin için tüm paketleri getir (pasif dahil)
export const getAllPackagesAdmin = async (req, res, next) => {
  try {
    const packages = await prisma.package.findMany({
      orderBy: { sortOrder: "asc" },
    });

    // Admin için tam veri döndür
    const formattedPackages = packages.map((pkg) => ({
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
    }));

    res.json(formattedPackages);
  } catch (error) {
    next(error);
  }
};

// Tek paket getir
export const getPackage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pkg = await prisma.package.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        isActive: true,
      },
    });

    if (!pkg) {
      return res.status(404).json({ message: "Paket bulunamadı" });
    }

    res.json({
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
  } catch (error) {
    next(error);
  }
};

// Yeni paket oluştur (admin)
export const createPackage = async (req, res, next) => {
  try {
    const { 
      slug, name, category, price, image, features, discount2, discount3, 
      reservationPrice, reservationDiscount2, reservationDiscount3, sortOrder 
    } = req.body;

    if (!slug || !name || !category || !price) {
      return res.status(400).json({ message: "Zorunlu alanlar eksik" });
    }

    const pkg = await prisma.package.create({
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
    });

    res.status(201).json({ message: "Paket oluşturuldu", package: pkg });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Bu slug zaten kullanılıyor" });
    }
    next(error);
  }
};

// Paket güncelle (admin)
export const updatePackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      name, category, price, image, features, discount2, discount3, 
      reservationPrice, reservationDiscount2, reservationDiscount3,
      isActive, sortOrder 
    } = req.body;

    const pkg = await prisma.package.update({
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
    });

    res.json({ message: "Paket güncellendi", package: pkg });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Paket bulunamadı" });
    }
    next(error);
  }
};

// Paket sil (admin)
export const deletePackage = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.package.delete({
      where: { id },
    });

    res.json({ message: "Paket silindi" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Paket bulunamadı" });
    }
    next(error);
  }
};
