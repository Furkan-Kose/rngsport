// Galeri bileşenlerinin (MediaGrid / MediaLightbox) ortak öğe tipi
export interface MediaItem {
  id: string;
  fileName: string;
  url: string; // orijinal
  contentType: string | null;
  size?: number | null;
  // Önizlemeler (eski kayıtlarda yok → orijinal gösterilir)
  thumbUrl?: string | null;
  previewUrl?: string | null;
  previewSize?: number | null;
}

export const isVideoItem = (item: MediaItem) => item.contentType?.startsWith("video/");

// Izgarada küçük resim, büyük görünümde önizleme; yoksa orijinal
export const gridSrc = (item: MediaItem) => item.thumbUrl || item.url;
export const lightboxSrc = (item: MediaItem) => item.previewUrl || item.url;

// İndirme kalitesi: orijinal ya da "telefon için" (önizleme sürümü)
export type MediaQuality = "original" | "preview";

// Liste yanıtındaki toplu indirme boyutları (byte)
export interface DownloadSizes {
  original: number;
  preview: number;
  hasPreview: boolean;
}

export const formatFileSize = (bytes: number | null | undefined) => {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

// İndirme uç noktalarına kalite parametresi (orijinal varsayılan, parametresiz)
export const withQuality = (path: string, quality: MediaQuality) => {
  if (quality === "original") return path;
  return `${path}${path.includes("?") ? "&" : "?"}quality=preview`;
};
