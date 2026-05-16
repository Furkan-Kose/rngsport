import prisma from "../lib/prisma.js";
import { AppError } from "./errors.js";
import { validateApparatuses } from "./apparatuses.js";

const pickPriceForOrder = (pkg, seriesCount) => {
  if (seriesCount === 1) return pkg.price;
  if (seriesCount === 2) return pkg.discount2;
  return pkg.discount3;
};

const pickPriceForReservation = (pkg, seriesCount) => {
  if (seriesCount === 1) return pkg.reservationPrice ?? pkg.price;
  if (seriesCount === 2) return pkg.reservationDiscount2 ?? pkg.discount2;
  return pkg.reservationDiscount3 ?? pkg.discount3;
};

// Frontend'den gelen item'ları doğrular, paketleri DB'den çeker, fiyatları
// güvenli şekilde DB'den hesaplar. Order ve Reservation create/update akışları
// için ortak yardımcı.
//
// options:
//   reservationPricing: true => reservationPrice/Discount alanlarını kullan
//   activeOnly: true => sadece aktif paketleri kabul et (create akışları için)
export const validateAndPriceItems = async (
  items,
  { reservationPricing = false, activeOnly = true } = {},
) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError("Tüm zorunlu alanları doldurun", 400);
  }
  if (items.length > 50) {
    throw new AppError("Maksimum 50 ürün eklenebilir", 400);
  }

  const packageIds = [...new Set(items.map((it) => it.packageId || it.package?.id))];

  const packages = await prisma.package.findMany({
    where: {
      slug: { in: packageIds },
      ...(activeOnly && { isActive: true }),
    },
  });

  const packageMap = new Map(packages.map((pkg) => [pkg.slug, pkg]));
  const pickPrice = reservationPricing ? pickPriceForReservation : pickPriceForOrder;

  const processedItems = [];
  let totalPrice = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const packageId = item.packageId || item.package?.id;
    const seriesCount = parseInt(item.seriesCount);
    const quantity = parseInt(item.quantity);

    if (!packageId) {
      throw new AppError(`Paket ID eksik (${i + 1}. satır)`, 400);
    }
    if (![1, 2, 3].includes(seriesCount)) {
      throw new AppError(`Geçersiz seri sayısı (${i + 1}. satır)`, 400);
    }
    if (isNaN(quantity) || quantity < 1 || quantity > 100) {
      throw new AppError(`Geçersiz adet (${i + 1}. satır)`, 400);
    }

    const pkg = packageMap.get(packageId);
    if (!pkg) {
      throw new AppError(`Paket bulunamadı: ${packageId}`, 400);
    }

    let apparatuses;
    try {
      apparatuses = validateApparatuses(item.apparatuses, seriesCount);
    } catch (err) {
      throw new AppError(
        `${i + 1}. paket: ${err.message ?? "Alet seçimi geçersiz"}`,
        400,
      );
    }

    const itemPrice = pickPrice(pkg, seriesCount);
    totalPrice += itemPrice * quantity;

    processedItems.push({
      packageId: pkg.slug,
      packageName: pkg.name,
      category: pkg.category,
      price: itemPrice,
      seriesCount,
      quantity,
      apparatuses,
    });
  }

  return { items: processedItems, totalPrice };
};
