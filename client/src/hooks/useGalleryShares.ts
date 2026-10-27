import { useEffect, useState } from "react";
import api from "../lib/api";

/** Galerim paylaşım linki (kapsam başına tek aktif link, 30 gün) */
export interface GalleryShare {
  id: string;
  token: string;
  album: string | null;
  expiresAt: string;
}

export const shareDaysLeft = (iso: string) =>
  Math.max(1, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));

// Müşterinin açık paylaşım linkleri. enabled=false (paylaşılan galeri sayfası) → istek yok.
export const useGalleryShares = (enabled: boolean) => {
  const [shares, setShares] = useState<GalleryShare[]>([]);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    api
      .get("/api/gallery/my/shares")
      .then(({ data }) => !cancelled && setShares(data.data))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return { shares, setShares };
};
