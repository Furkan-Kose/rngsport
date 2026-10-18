import { currentLocaleTag } from "./format";

// Sadakat sistemi — /api/loyalty yanıt tipleri ve istemci tarafı gösterim hesapları.
// Fiyat ve puanın asıl kaynağı her zaman backend'dir (utils/loyalty.js); buradaki
// hesap yalnızca formda kullanıcıya önizleme göstermek için.

export interface LoyaltyTier {
  id: string;
  name: string;
  minPoints: number;
  discountPercent: number;
  /** EN/RU ad (admin formu için; public yanıtta name zaten çevrili) */
  translations?: Partial<Record<"en" | "ru", { name?: string }>>;
}

export interface PointTransaction {
  id: string;
  amount: number;
  type: "EARN" | "REVERSE" | "REDEEM" | "REFUND" | "ADJUST";
  note: string | null;
  createdAt: string;
}

export interface LoyaltySummary {
  balance: number;
  tier: LoyaltyTier | null;
  nextTier: LoyaltyTier | null;
  pointsToNext: number;
  transactions: PointTransaction[];
}

// Backend applyDiscount'un aynısı (kuruşa yuvarlama dahil)
export const applyDiscount = (subtotal: number, discountPercent: number) => {
  const discountAmount = Math.round(subtotal * discountPercent) / 100;
  return {
    discountAmount,
    totalPrice: Math.round((subtotal - discountAmount) * 100) / 100,
  };
};

// Paket puanı × seri × adet
export const pointsFor = (loyaltyPoints: number | undefined, seriesCount: number, quantity: number) =>
  (loyaltyPoints || 0) * seriesCount * quantity;

// Hareket türlerinin Türkçe karşılıkları (profil + admin ortak)
export const POINT_TYPE_LABELS: Record<PointTransaction["type"], string> = {
  EARN: "Kazanıldı",
  REVERSE: "Geri alındı",
  REDEEM: "İndirimde kullanıldı",
  REFUND: "İade edildi",
  ADJUST: "Düzeltme",
};

export const formatTL = (value: number) =>
  `₺${value.toLocaleString(currentLocaleTag(), { maximumFractionDigits: 2 })}`;
