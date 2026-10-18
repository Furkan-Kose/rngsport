// /api/award-ceremonies yanıt tipleri — public sayfalar ve admin paneli ortak

export interface AwardCeremony {
  /** EN/RU çevirileri (admin formu için; public yanıtta metinler zaten çevrili) */
  translations?: Partial<Record<"en" | "ru", Record<string, string | string[]>>>;
  id: string;
  slug: string;
  title: string;
  description: string | null;
  date: string | null;
  location: string | null;
  sortOrder: number;
  createdAt: string;
}

// Liste uç noktası kapak + dosya sayısı da döner
export interface AwardCeremonySummary extends AwardCeremony {
  photoCount: number;
  coverUrl: string | null;
}

export interface AwardPhoto {
  id: string;
  fileName: string;
  url: string;
  size: number | null;
  contentType: string | null;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Kapak fotoğrafı henüz yüklenmemiş törenler için
export const AWARD_FALLBACK_IMAGE = "/odul-torenleri.jpeg";

