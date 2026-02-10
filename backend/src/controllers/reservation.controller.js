import prisma from "../lib/prisma.js";

export const getAllReservations = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10)); // Limit 1-100 arası
    const status = req.query.status;
    const search = req.query.search ? String(req.query.search).trim().slice(0, 100) : undefined; // Search validasyonu

    const skip = (page - 1) * limit;

    // Where koşulları
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

    // Paralel sorgular: veriler ve toplam sayı
    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: {
          items: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.reservation.count({ where }),
    ]);

    res.json({
      data: reservations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

export const getReservation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!reservation) {
      return res.status(404).json({ message: "Rezervasyon bulunamadı" });
    }

    res.json({
      id: reservation.id,
      athleteName: reservation.athleteName,
      clubName: reservation.clubName,
      birthYear: reservation.birthYear,
      customerPhone: reservation.customerPhone,
      customerEmail: reservation.customerEmail,
      notes: reservation.notes,
      totalPrice: reservation.totalPrice,
      status: reservation.status,
      createdAt: reservation.createdAt,
      items: reservation.items.map(item => ({
        package: {
          id: item.packageId,
          name: item.packageName,
          category: item.category,
        },
        seriesCount: item.seriesCount,
        quantity: item.quantity,
        price: item.price,
      })),
    });
  } catch (error) {
    next(error);
  }
}   

export const createReservation = async (req, res, next) => {
  try {
    const { athleteName, clubName, birthYear, customerPhone, customerEmail, notes, items } = req.body;

    // Temel validasyon
    if (!athleteName || !clubName || !birthYear || !customerPhone || !customerEmail || !items || items.length === 0) {
      return res.status(400).json({ message: "Tüm zorunlu alanları doldurun" });
    }

    // Detaylı validasyonlar
    const trimmedAthleteName = String(athleteName).trim();
    const trimmedClubName = String(clubName).trim();
    const trimmedPhone = String(customerPhone).trim();
    const trimmedEmail = String(customerEmail).trim().toLowerCase();

    if (trimmedAthleteName.length < 2 || trimmedAthleteName.length > 100) {
      return res.status(400).json({ message: "Sporcu adı 2-100 karakter arasında olmalı" });
    }
    if (trimmedClubName.length < 2 || trimmedClubName.length > 100) {
      return res.status(400).json({ message: "Kulüp adı 2-100 karakter arasında olmalı" });
    }
    if (!/^[0-9\s\+\-()]{10,20}$/.test(trimmedPhone)) {
      return res.status(400).json({ message: "Geçersiz telefon numarası" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail) || trimmedEmail.length > 100) {
      return res.status(400).json({ message: "Geçersiz e-posta adresi" });
    }
    if (items.length > 50) {
      return res.status(400).json({ message: "Maksimum 50 ürün eklenebilir" });
    }

    // Frontend'den sadece packageId, seriesCount ve quantity al
    // Fiyatları veritabanından çek (GÜVENLİK İÇİN KRİTİK)
    const packageIds = [...new Set(items.map(item => item.packageId || item.package?.id))];
    
    const packages = await prisma.package.findMany({
      where: {
        slug: { in: packageIds },
        isActive: true,
      },
    });

    // Paket map'i oluştur (hızlı erişim için)
    const packageMap = new Map();
    packages.forEach(pkg => packageMap.set(pkg.slug, pkg));

    // Item'ları doğrula ve fiyatları hesapla
    const reservationItems = [];
    let calculatedTotalPrice = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const packageId = item.packageId || item.package?.id;
      const seriesCount = parseInt(item.seriesCount);
      const quantity = parseInt(item.quantity);

      // Validasyonlar
      if (!packageId) {
        return res.status(400).json({ message: `Paket ID eksik (${i + 1}. satır)` });
      }
      if (![1, 2, 3].includes(seriesCount)) {
        return res.status(400).json({ message: `Geçersiz seri sayısı (${i + 1}. satır)` });
      }
      if (isNaN(quantity) || quantity < 1 || quantity > 100) {
        return res.status(400).json({ message: `Geçersiz adet (${i + 1}. satır)` });
      }

      // Paketi veritabanından al
      const pkg = packageMap.get(packageId);
      if (!pkg) {
        return res.status(400).json({ message: `Paket bulunamadı: ${packageId}` });
      }

      // Rezervasyon fiyatını veritabanından hesapla (FRONTEND'DEN GELEN FİYATI KULLANMA!)
      let itemPrice;
      if (seriesCount === 1) {
        itemPrice = pkg.reservationPrice ?? pkg.price;
      } else if (seriesCount === 2) {
        itemPrice = pkg.reservationDiscount2 ?? pkg.discount2;
      } else {
        itemPrice = pkg.reservationDiscount3 ?? pkg.discount3;
      }

      calculatedTotalPrice += itemPrice * quantity;

      reservationItems.push({
        packageId: pkg.slug,
        packageName: pkg.name,
        category: pkg.category,
        price: itemPrice,
        seriesCount,
        quantity,
      });
    }

    const reservation = await prisma.reservation.create({
      data: {
        athleteName: trimmedAthleteName,
        clubName: trimmedClubName,
        birthYear,
        customerPhone: trimmedPhone,
        customerEmail: trimmedEmail,
        notes: notes ? String(notes).trim().slice(0, 500) : null,
        totalPrice: calculatedTotalPrice, // Backend'de hesaplanan fiyat
        items: {
          create: reservationItems,
        },
      },
      include: {
        items: true,
      },
    });

    res.status(201).json({ 
      message: "Rezervasyon oluşturuldu", 
      reservation: {
        id: reservation.id,
        athleteName: reservation.athleteName,
        clubName: reservation.clubName,
        customerEmail: reservation.customerEmail,
        totalPrice: reservation.totalPrice,
        status: reservation.status,
        items: reservation.items.map(item => ({
          package: {
            id: item.packageId,
            name: item.packageName,
          },
          seriesCount: item.seriesCount,
          quantity: item.quantity,
        })),
      }
    });
  } catch (error) {
    next(error);
  }
}

export const updateReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Status validasyonu - sadece geçerli değerlere izin ver
    const validStatuses = ["PENDING", "CONFIRMED", "PAID", "CANCELLED"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Geçersiz rezervasyon durumu" });
    }

    // Notes validasyonu
    const sanitizedNotes = notes !== undefined 
      ? (notes ? String(notes).trim().slice(0, 500) : null)
      : undefined;

    const reservation = await prisma.reservation.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(sanitizedNotes !== undefined && { notes: sanitizedNotes }),
      },
      include: {
        items: true,
      },
    });

    res.json({ message: "Rezervasyon güncellendi", reservation });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Rezervasyon bulunamadı" });
    }
    next(error);
  }
}

export const deleteReservation = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.reservation.delete({
      where: { id },
    });

    res.json({ message: "Rezervasyon silindi" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Rezervasyon bulunamadı" });
    }
    next(error);
  }
}

// Dashboard için rezervasyon istatistikleri
export const getReservationStats = async (req, res, next) => {
  try {
    const [total, confirmed, pending, paid, recentReservations, revenue] = await Promise.all([
      prisma.reservation.count(),
      prisma.reservation.count({ where: { status: "CONFIRMED" } }),
      prisma.reservation.count({ where: { status: "PENDING" } }),
      prisma.reservation.count({ where: { status: "PAID" } }),
      prisma.reservation.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          athleteName: true,
          clubName: true,
          totalPrice: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.reservation.aggregate({
        where: { status: { in: ["CONFIRMED", "PAID"] } },
        _sum: { totalPrice: true },
      }),
    ]);

    res.json({
      total,
      confirmed,
      pending,
      paid,
      revenue: revenue._sum.totalPrice || 0,
      recentReservations,
    });
  } catch (error) {
    next(error);
  }
}