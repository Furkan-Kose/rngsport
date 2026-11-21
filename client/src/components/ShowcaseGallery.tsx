import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import Reveal from "./ui/Reveal";
import { backdropClass, useDialog } from "./ui/Modal";
import { Chip, EmptyState } from "./ui/kit";
import { cx, iconButtonClass } from "../lib/siteUi";
import type { GalleryItem } from "../data/gallery";

/**
 * Tanıtım galerisi (statik örnek çalışmalar): filtre + ızgara + lightbox.
 * Ana sayfadaki "Galeri" bölümü ve /galeri sayfası aynı bileşeni kullanır.
 * Müşterinin kendi dosyaları ayrı: MediaGrid / MediaLightbox.
 */

const thumbnailOf = (item: GalleryItem) =>
  item.type === "video" && item.vimeoId
    ? item.thumbnail || `https://vumbnail.com/${item.vimeoId}.jpg`
    : item.thumbnail;

type Filter = "all" | "photo" | "video";
const FILTERS: Filter[] = ["all", "photo", "video"];

interface ShowcaseGalleryProps {
  items: GalleryItem[];
  /** Geniş ekranda sütun sayısı */
  columns?: 3 | 4;
}

const ShowcaseGallery = ({ items, columns = 3 }: ShowcaseGalleryProps) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<Filter>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const visible = filter === "all" ? items : items.filter((item) => item.type === filter);
  const current = openIndex !== null ? visible[openIndex] : null;

  const close = () => setOpenIndex(null);
  const step = (delta: number) =>
    setOpenIndex((i) => (i === null ? i : (i + delta + visible.length) % visible.length));

  const dialogRef = useDialog(current !== null, close);

  // Ok tuşlarıyla gezinme (Esc ve Tab'ı useDialog yönetir)
  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      const delta = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
      if (delta) setOpenIndex((i) => (i === null ? i : (i + delta + visible.length) % visible.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, visible.length]);

  const filterLabel = (f: Filter) =>
    f === "all" ? t("home.gallery.all") : t(`home.gallery.${f}`);

  return (
    <>
      <div role="group" aria-label={t("home.gallery.filterLabel")} className="flex flex-wrap justify-center gap-2 mb-8">
        {FILTERS.map((f) => (
          <Chip
            key={f}
            active={filter === f}
            onClick={() => {
              setFilter(f);
              setOpenIndex(null);
            }}
          >
            {filterLabel(f)}
            <span className="text-zinc-400 font-normal">
              {f === "all" ? items.length : items.filter((i) => i.type === f).length}
            </span>
          </Chip>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState title={t("pages.gallery.empty")} className="max-w-md mx-auto" />
      ) : (
        <ul className={cx("grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4", columns === 4 && "lg:grid-cols-4")}>
          {visible.map((item, index) => (
            <Reveal key={item.id} delay={(index % 8) * 0.03}>
              <li>
                <button
                  type="button"
                  onClick={() => setOpenIndex(index)}
                  aria-label={`${item.title} — ${filterLabel(item.type)}`}
                  className="group relative block w-full aspect-square overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors"
                >
                  <img
                    src={thumbnailOf(item)}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {item.type === "video" && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="w-14 h-14 rounded-full bg-black/60 border border-white/30 flex items-center justify-center">
                        <Play className="w-6 h-6 text-white fill-white ml-0.5" aria-hidden />
                      </span>
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 p-3 pt-8 text-left text-sm font-medium text-white bg-linear-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
                    {item.title}
                  </span>
                </button>
              </li>
            </Reveal>
          ))}
        </ul>
      )}

      {current &&
        openIndex !== null &&
        createPortal(
          <div
            className={cx(backdropClass, "bg-black/90 flex items-center justify-center")}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label={current.title}
              tabIndex={-1}
              className="relative w-full max-w-[95vw] lg:max-w-[85vw] px-2 sm:px-16 outline-none animate-dialog-in"
            >
              {current.type === "video" && current.vimeoId ? (
                <div className="relative w-full h-[70vh] lg:h-[80vh]">
                  <iframe
                    key={current.id}
                    className="absolute inset-0 w-full h-full rounded-lg"
                    src={`https://player.vimeo.com/video/${current.vimeoId}?autoplay=1&title=0&byline=0&portrait=0`}
                    title={current.title}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <img
                  key={current.id}
                  src={current.src}
                  alt={current.title}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg mx-auto"
                />
              )}
              <p className="text-center mt-4 text-zinc-300">
                {current.title}
                <span className="text-zinc-400 ml-3">
                  {openIndex + 1} / {visible.length}
                </span>
              </p>

              <button
                type="button"
                onClick={() => step(-1)}
                aria-label={t("common.previous")}
                className={iconButtonClass("secondary", "absolute left-2 top-1/2 -translate-y-1/2")}
              >
                <ChevronLeft className="w-6 h-6" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label={t("common.next")}
                className={iconButtonClass("secondary", "absolute right-2 top-1/2 -translate-y-1/2")}
              >
                <ChevronRight className="w-6 h-6" aria-hidden />
              </button>
              <button
                type="button"
                onClick={close}
                aria-label={t("common.close")}
                className={iconButtonClass("secondary", "fixed top-4 right-4")}
              >
                <X className="w-6 h-6" aria-hidden />
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default ShowcaseGallery;
