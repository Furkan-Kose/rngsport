// Parça parça teslim (backend utils/delivery.js ile aynı kurallar).
// deliveries: { photo?: ISO, video?: ISO, reels?: ISO, general?: ISO }

export type DeliveryType = "photo" | "video" | "reels" | "general";
export type Deliveries = Partial<Record<DeliveryType, string>> | null | undefined;

export const DELIVERY_TYPES: DeliveryType[] = ["photo", "video", "reels", "general"];

export const DELIVERY_ICONS: Record<DeliveryType, string> = {
  photo: "📸",
  video: "🎬",
  reels: "🎞️",
  general: "📦",
};

// Admin paneli Türkçe
export const DELIVERY_LABELS_TR: Record<DeliveryType, string> = {
  photo: "Fotoğraf",
  video: "Video",
  reels: "Video Reels",
  general: "Genel",
};

export const DELIVERY_SUBJECTS_TR: Record<DeliveryType, string> = {
  photo: "Fotoğraflarınız hazır",
  video: "Videonuz hazır",
  reels: "Reels videonuz hazır",
  general: "Dosyalarınız hazır",
};

const REELS_PACKAGES = new Set(["video-reels"]);

// Paketlere göre hangi parçalar teslim edilecek
export const deliveryContents = (items: { packageId: string; category: string }[]) => {
  const has = { photo: false, video: false, reels: false };
  for (const item of items) {
    if (REELS_PACKAGES.has(item.packageId)) {
      has.reels = true;
      continue;
    }
    if (item.category === "photo" || item.category === "full") has.photo = true;
    if (item.category === "video" || item.category === "full") has.video = true;
  }
  return has;
};
