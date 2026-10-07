// Galeri bileşenlerinin (MediaGrid / MediaLightbox) ortak öğe tipi
export interface MediaItem {
  id: string;
  fileName: string;
  url: string;
  contentType: string | null;
}

export const isVideoItem = (item: MediaItem) => item.contentType?.startsWith("video/");
