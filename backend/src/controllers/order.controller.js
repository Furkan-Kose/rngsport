import prisma from "../lib/prisma.js";

export const createOrder = async (req, res, next) => {
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
    const orderItems = [];
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

      // Fiyatı veritabanından hesapla (FRONTEND'DEN GELEN FİYATI KULLANMA!)
      let itemPrice;
      if (seriesCount === 1) {
        itemPrice = pkg.price;
      } else if (seriesCount === 2) {
        itemPrice = pkg.discount2;
      } else {
        itemPrice = pkg.discount3;
      }

      calculatedTotalPrice += itemPrice * quantity;

      orderItems.push({
        packageId: pkg.slug,
        packageName: pkg.name,
        category: pkg.category,
        price: itemPrice,
        seriesCount,
        quantity,
      });
    }

    const order = await prisma.order.create({
      data: {
        athleteName: trimmedAthleteName,
        clubName: trimmedClubName,
        birthYear,
        customerPhone: trimmedPhone,
        customerEmail: trimmedEmail,
        notes: notes ? String(notes).trim().slice(0, 500) : null,
        totalPrice: calculatedTotalPrice, // Backend'de hesaplanan fiyat
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
      },
    });

    res.status(201).json({ 
      message: "Sipariş oluşturuldu", 
      order: {
        id: order.id,
        athleteName: order.athleteName,
        clubName: order.clubName,
        customerEmail: order.customerEmail,
        totalPrice: order.totalPrice,
        items: order.items.map(item => ({
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
};

export const getAllOrders = async (req, res, next) => {
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
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
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
      prisma.order.count({ where }),
    ]);

    res.json({
      data: orders,
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
};

export const getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Sipariş bulunamadı" });
    }

    // Frontend'in beklediği formatta dön
    res.json({
      id: order.id,
      athleteName: order.athleteName,
      clubName: order.clubName,
      birthYear: order.birthYear,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      notes: order.notes,
      totalPrice: order.totalPrice,
      status: order.status,
      createdAt: order.createdAt,
      items: order.items.map(item => ({
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
};

export const updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, paymentId } = req.body;

    // Status validasyonu - sadece geçerli değerlere izin ver
    const validStatuses = ["PENDING", "PAID", "FAILED", "CANCELLED"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Geçersiz sipariş durumu" });
    }

    // paymentId validasyonu
    if (paymentId && (typeof paymentId !== "string" || paymentId.length > 100)) {
      return res.status(400).json({ message: "Geçersiz ödeme ID" });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(paymentId && { paymentId: paymentId.trim() }),
      },
      include: {
        items: true,
      },
    });

    res.json({ message: "Sipariş güncellendi", order });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Sipariş bulunamadı" });
    }
    next(error);
  }
};

export const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.order.delete({
      where: { id },
    });

    res.json({ message: "Sipariş silindi" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Sipariş bulunamadı" });
    }
    next(error);
  }
};

// Dashboard için sipariş istatistikleri
export const getOrderStats = async (req, res, next) => {
  try {
    const [total, paid, pending, failed, recentOrders, revenue] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "PAID" } }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "FAILED" } }),
      prisma.order.findMany({
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
      prisma.order.aggregate({
        where: { status: "PAID" },
        _sum: { totalPrice: true },
      }),
    ]);

    res.json({
      total,
      paid,
      pending,
      failed,
      revenue: revenue._sum.totalPrice || 0,
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};
