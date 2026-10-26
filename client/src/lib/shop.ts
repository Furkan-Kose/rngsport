import api from "./api";
import { localizeProduct, products as staticProducts, type Product } from "../data/products";

// Mağaza (kişiye özel ürünler) — /api/shop. Paket siparişlerinden ayrı.

export type ShopStatus =
  | "PENDING"
  | "FAILED"
  | "CONFIRMED"
  | "IN_PRODUCTION"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface ShopField {
  key: string;
  label: string;
  required: boolean;
  maxLength: number;
}

export interface ShopPose {
  no: number;
  label: string | null;
  image: string;
}

/** Müşteriye gelen seçenekler: yalnızca fotoğraflı pozu olan aletler */
export interface ShopPoseOptions {
  enabled: boolean;
  apparatuses: { slug: string; poses: ShopPose[] }[];
}

export interface ShopSelection {
  apparatus: string;
  poseNo: number;
  poseLabel: string | null;
  poseImage: string | null;
}

export interface ShopProduct {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  summary: string | null;
  description: string | null;
  price: number | null;
  image: string | null;
  customFields: ShopField[];
  poseOptions: ShopPoseOptions | null;
  purchasable: boolean;
}

export interface ShopOrder {
  id: string;
  productName: string;
  productSlug: string;
  productImage: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  personalization: Record<string, string>;
  fieldLabels: Record<string, string>;
  selection: ShopSelection | null;
  recipientName: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  postalCode: string | null;
  customerNote: string | null;
  trackingInfo: string | null;
  status: ShopStatus;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

export interface ShippingInput {
  recipientName: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  postalCode: string;
  note: string;
}

/** Müşterinin göreceği ilerleme adımları (iptal/ödenmemiş hariç) */
export const SHOP_PROGRESS: ShopStatus[] = ["CONFIRMED", "IN_PRODUCTION", "SHIPPED", "DELIVERED"];
export const isUnpaid = (status: ShopStatus) => status === "PENDING" || status === "FAILED";

export const SHOP_STATUS_CLASSES: Record<ShopStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  FAILED: "bg-red-500/10 text-red-400 border-red-500/30",
  CONFIRMED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  IN_PRODUCTION: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  SHIPPED: "bg-violet-500/10 text-violet-300 border-violet-500/30",
  DELIVERED: "bg-teal-500/10 text-teal-300 border-teal-500/30",
  CANCELLED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
};

/** Ödeme başlatır ve iyzico'nun kendi sayfasına yönlendirir */
export const startShopCheckout = async (orderId: string) => {
  const { data } = await api.post<{ paymentPageUrl?: string }>(`/api/shop/orders/${orderId}/checkout`);
  if (!data.paymentPageUrl) throw new Error("paymentPageUrl yok");
  window.location.href = data.paymentPageUrl;
};

// ---------------------------------------------------------------------------
// Vitrin: panelden gelen ürünler + data/products.ts'teki tanıtım metinleri
// ---------------------------------------------------------------------------

/** Kartlarda ve listede kullanılan ortak ürün görünümü */
export interface ShowcaseItem {
  slug: string;
  number: string;
  name: string;
  tagline: string;
  summary: string;
  image: string;
  imageAlt: string;
  price: number | null;
  purchasable: boolean;
  /** Uzun tanıtım metni olan eski ürün (data/products.ts) */
  staticProduct?: Product;
  shop?: ShopProduct;
}

const fromStatic = (p: Product): ShowcaseItem => ({
  slug: p.slug,
  number: p.number,
  name: p.name,
  tagline: p.tagline,
  summary: p.cardSummary,
  image: p.image,
  imageAlt: p.imageAlt,
  price: null,
  purchasable: false,
  staticProduct: p,
});

/**
 * Aktif mağaza ürünleri önce (panel sırasıyla); panelde aktif olmayan eski vitrin
 * ürünleri "Çok yakında" olarak arkadan gelir. Ad/görsel paneldeki değerdir.
 */
export const buildShowcase = (shopProducts: ShopProduct[] | null, lang: string): ShowcaseItem[] => {
  const localizedStatic = staticProducts.map((p) => localizeProduct(p, lang));
  const bySlug = new Map(localizedStatic.map((p) => [p.slug, p]));
  const active = (shopProducts ?? []).map((sp, i): ShowcaseItem => {
    const st = bySlug.get(sp.slug);
    return {
      slug: sp.slug,
      number: st?.number ?? String(i + 1).padStart(2, "0"),
      name: sp.name,
      tagline: sp.tagline ?? st?.tagline ?? "",
      summary: sp.summary ?? st?.cardSummary ?? "",
      image: sp.image ?? st?.image ?? "/products/product.jpeg",
      imageAlt: st?.imageAlt ?? sp.name,
      price: sp.price,
      purchasable: sp.purchasable,
      staticProduct: st,
      shop: sp,
    };
  });
  const activeSlugs = new Set(active.map((a) => a.slug));
  // Kartlardaki "01, 02 …" son sıraya göre verilir (aynı numara iki kartta çıkmasın)
  return [...active, ...localizedStatic.filter((p) => !activeSlugs.has(p.slug)).map(fromStatic)].map(
    (item, i) => ({ ...item, number: String(i + 1).padStart(2, "0") })
  );
};
