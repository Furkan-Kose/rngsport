import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, ChevronLeft, ChevronRight, Loader2, Smartphone } from "lucide-react";

import { formatFileSize, isVideoItem, lightboxSrc, type MediaItem, type MediaQuality } from "../lib/media";

interface MediaLightboxProps {
  items: MediaItem[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
  onDownload: (item: MediaItem, quality: MediaQuality) => void;
  downloadingId: string | null;
}

// Foto/video lightbox'ı (indirme butonlu). Müşteri galerisi ve ödül törenleri ortak.
const MediaLightbox = ({ items, index, onIndexChange, onDownload, downloadingId }: MediaLightboxProps) => {
  const { t } = useTranslation();
  const item = index !== null ? items[index] : null;
  const isOpen = item != null;

  // Açıkken sayfa kaydırmasını kilitle + klavye kısayolları.
  // Cleanup'lı effect: component açıkken unmount olsa bile scroll kilitli kalmaz.
  useEffect(() => {
    if (!isOpen || index === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onIndexChange(null);
      } else if (e.key === "ArrowLeft" && index > 0) {
        onIndexChange(index - 1);
      } else if (e.key === "ArrowRight" && index < items.length - 1) {
        onIndexChange(index + 1);
      }
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, index, items.length, onIndexChange]);

  // document.body'ye portal'lanır: MainLayout'taki `relative z-10` sarmalayıcı
  // stacking context oluşturduğu için, portal olmadan header (z-50) üstte kalır.
  return createPortal(
    <AnimatePresence>
      {item && index !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => onIndexChange(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={() => onIndexChange(null)}
          >
            <X className="w-6 h-6" />
          </button>

          {index > 0 && (
            <button
              className="absolute left-2 sm:left-6 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange(index - 1);
              }}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {index < items.length - 1 && (
            <button
              className="absolute right-2 sm:right-6 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange(index + 1);
              }}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="max-w-5xl max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {isVideoItem(item) ? (
              <video
                key={item.id}
                src={item.url}
                controls
                autoPlay
                className="max-w-full max-h-[75vh] rounded-xl"
              />
            ) : (
              <img
                key={item.id}
                src={lightboxSrc(item)}
                alt={item.fileName}
                className="max-w-full max-h-[75vh] object-contain rounded-xl"
              />
            )}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              <p className="text-sm text-zinc-400 truncate max-w-60">{item.fileName}</p>
              <button
                onClick={() => onDownload(item, "original")}
                disabled={downloadingId === item.id}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium transition-all duration-300 disabled:opacity-50"
              >
                {downloadingId === item.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {item.previewUrl ? t("pages.media.downloadOriginal") : t("pages.media.download")}
                {item.size ? <span className="opacity-75">· {formatFileSize(item.size)}</span> : null}
              </button>
              {item.previewUrl && (
                <button
                  onClick={() => onDownload(item, "preview")}
                  disabled={downloadingId === item.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-medium transition-all duration-300 disabled:opacity-50"
                >
                  <Smartphone className="w-4 h-4" />
                  {t("pages.media.downloadSmall")}
                  {item.previewSize ? (
                    <span className="opacity-75">· {formatFileSize(item.previewSize)}</span>
                  ) : null}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default MediaLightbox;
