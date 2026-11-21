import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, ChevronLeft, ChevronRight, ChevronDown, Loader2, Shrink, ImageDown } from "lucide-react";

import { backdropClass, useDialog } from "./ui/Modal";
import { buttonClass, cx, iconButtonClass } from "../lib/siteUi";
import { formatFileSize, isVideoItem, lightboxSrc, type MediaItem, type MediaQuality } from "../lib/media";

interface MediaLightboxProps {
  items: MediaItem[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
  onDownload: (item: MediaItem, quality: MediaQuality) => void;
  downloadingId: string | null;
  /** Telefonda: doğrudan galeriye kaydet (paylaşım menüsü). Verilmezse buton çıkmaz. */
  onSaveToGallery?: (item: MediaItem) => void;
}

// Foto/video lightbox'ı (indirme butonlu). Müşteri galerisi ve ödül törenleri ortak.
const MediaLightbox = ({ items, index, onIndexChange, onDownload, downloadingId, onSaveToGallery }: MediaLightboxProps) => {
  const { t } = useTranslation();
  const item = index !== null ? items[index] : null;
  const isOpen = item != null;
  // "Diğer" menüsü hangi dosya için açık (başka dosyaya geçince kendiliğinden kapanır)
  const [moreFor, setMoreFor] = useState<string | null>(null);

  // Esc, Tab döngüsü ve kaydırma kilidi useDialog'da; burada yalnızca ok tuşları
  const dialogRef = useDialog(isOpen, () => onIndexChange(null));
  useEffect(() => {
    if (!isOpen || index === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && index > 0) onIndexChange(index - 1);
      else if (e.key === "ArrowRight" && index < items.length - 1) onIndexChange(index + 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
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
          className={cx(backdropClass, "bg-black/90 flex items-center justify-center p-4")}
          onClick={() => onIndexChange(null)}
        >

          {index > 0 && (
            <button
              type="button"
              aria-label={t("common.previous")}
              className={iconButtonClass("secondary", "absolute left-2 sm:left-6 z-10")}
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
              type="button"
              aria-label={t("common.next")}
              className={iconButtonClass("secondary", "absolute right-2 sm:right-6 z-10")}
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange(index + 1);
              }}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={item.fileName}
            tabIndex={-1}
            className="max-w-5xl max-h-[92dvh] flex flex-col items-center outline-none animate-dialog-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label={t("common.close")}
              className={iconButtonClass("secondary", "fixed top-4 right-4 z-10")}
              onClick={() => onIndexChange(null)}
            >
              <X className="w-6 h-6" aria-hidden />
            </button>
            {isVideoItem(item) ? (
              <video
                key={item.id}
                src={item.url}
                poster={item.thumbUrl ?? undefined}
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
            {/* Tek ana buton: telefonda "Galeriye kaydet", bilgisayarda "İndir".
                Diğer seçenekler (orijinal/küçük indir) ikinci planda. */}
            <div className="flex flex-col items-center gap-2 mt-4 w-full">
              <p className="text-sm text-zinc-400 truncate max-w-72">{item.fileName}</p>
              {onSaveToGallery ? (
                <>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSaveToGallery(item)}
                      className={buttonClass("primary", "lg")}
                    >
                      <ImageDown className="w-5 h-5" />
                      {t("pages.media.select.saveToGallery")}
                    </button>
                    <button
                      onClick={() => setMoreFor(moreFor === item.id ? null : item.id)}
                      aria-expanded={moreFor === item.id}
                      className={buttonClass("secondary", "lg", "px-4")}
                    >
                      {t("pages.media.more")}
                      <ChevronDown className={`w-4 h-4 transition-transform ${moreFor === item.id ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                  {moreFor === item.id && (
                    <div className="flex flex-wrap justify-center gap-2">
                      <button
                        onClick={() => onDownload(item, "original")}
                        disabled={downloadingId === item.id}
                        className={buttonClass("secondary", "sm")}
                      >
                        {downloadingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        {t("pages.media.downloadOriginal")}
                        {item.size ? <span className="opacity-70">· {formatFileSize(item.size)}</span> : null}
                      </button>
                      {item.previewUrl && (
                        <button
                          onClick={() => onDownload(item, "preview")}
                          disabled={downloadingId === item.id}
                          className={buttonClass("secondary", "sm")}
                        >
                          <Shrink className="w-3.5 h-3.5" />
                          {t("pages.media.downloadSmall")}
                          {item.previewSize ? <span className="opacity-70">· {formatFileSize(item.previewSize)}</span> : null}
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => onDownload(item, "original")}
                    disabled={downloadingId === item.id}
                    className={buttonClass("primary", "lg")}
                  >
                    {downloadingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {t("pages.media.download")}
                    {item.size ? <span className="opacity-75 font-normal">· {formatFileSize(item.size)}</span> : null}
                  </button>
                  {item.previewUrl && (
                    <button
                      onClick={() => onDownload(item, "preview")}
                      disabled={downloadingId === item.id}
                      className={buttonClass("ghost", "md", "underline underline-offset-4")}
                    >
                      {t("pages.media.downloadSmall")}
                      {item.previewSize ? ` · ${formatFileSize(item.previewSize)}` : ""}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default MediaLightbox;
