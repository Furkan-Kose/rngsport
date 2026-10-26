import { Check, Download, Loader2, Play } from "lucide-react";
import { formatFileSize, gridSrc, isVideoItem, type MediaItem, type MediaQuality } from "../lib/media";
import { useTranslation } from "react-i18next";
import { isMobileDevice } from "../lib/device";

interface MediaGridProps {
  items: MediaItem[];
  onOpen: (index: number) => void;
  onDownload: (item: MediaItem, quality: MediaQuality) => void;
  downloadingId: string | null;
  /** Seç modu: dokunmak büyütmek yerine işaretler; tek tek indirme butonu gizlenir */
  selecting?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

// Tıklayınca lightbox açan, hover'da indirme butonu çıkan foto/video ızgarası
const MediaGrid = ({ items, onOpen, onDownload, downloadingId, selecting = false, selectedIds, onToggleSelect }: MediaGridProps) => {
  const { t } = useTranslation();
  return (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
    {items.map((item, index) => {
      const selected = selecting && !!selectedIds?.has(item.id);
      return (
      <div
        key={item.id}
        role={selecting ? "checkbox" : undefined}
        aria-checked={selecting ? selected : undefined}
        className={`relative group aspect-square rounded-xl overflow-hidden bg-zinc-900 border cursor-pointer select-none ${
          selected ? "border-emerald-400 ring-2 ring-emerald-500/60" : "border-zinc-800"
        }`}
        onClick={() => (selecting ? onToggleSelect?.(item.id) : onOpen(index))}
      >
        {isVideoItem(item) && !item.thumbUrl ? (
          <video
            src={item.url}
            preload="metadata"
            muted
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <img
            src={gridSrc(item)}
            alt={item.fileName}
            loading="lazy"
            draggable={false}
            className={`w-full h-full object-cover transition-transform duration-300 ${selecting ? "" : "group-hover:scale-105"} ${selected ? "scale-95 rounded-lg" : ""}`}
          />
        )}
        {isVideoItem(item) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
            </div>
          </div>
        )}
        <div className={`absolute inset-0 transition-colors duration-300 ${selected ? "bg-emerald-500/15" : "bg-black/0 group-hover:bg-black/30"}`} />

        {selecting ? (
          <span
            className={`absolute top-2 left-2 w-7 h-7 rounded-full border-2 flex items-center justify-center shadow ${
              selected ? "bg-emerald-500 border-emerald-300 text-white" : "bg-black/40 border-white/80"
            }`}
          >
            {selected && <Check className="w-4 h-4" />}
          </span>
        ) : isMobileDevice() ? null : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(item, "original");
            }}
            disabled={downloadingId === item.id}
            className="absolute bottom-2 right-2 p-2 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-white sm:opacity-0 sm:group-hover:opacity-100 hover:bg-emerald-600/80 transition-all duration-300"
            title={`${t("pages.media.downloadOriginal")} ${formatFileSize(item.size)}`.trim()}
          >
            {downloadingId === item.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      );
    })}
  </div>
  );
};

export default MediaGrid;
