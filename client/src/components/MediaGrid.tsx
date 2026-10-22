import { Download, Loader2, Play } from "lucide-react";
import { formatFileSize, gridSrc, isVideoItem, type MediaItem, type MediaQuality } from "../lib/media";
import { useTranslation } from "react-i18next";


interface MediaGridProps {
  items: MediaItem[];
  onOpen: (index: number) => void;
  onDownload: (item: MediaItem, quality: MediaQuality) => void;
  downloadingId: string | null;
}

// Tıklayınca lightbox açan, hover'da indirme butonu çıkan foto/video ızgarası
const MediaGrid = ({ items, onOpen, onDownload, downloadingId }: MediaGridProps) => {
  const { t } = useTranslation();
  return (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
    {items.map((item, index) => (
      <div
        key={item.id}
        className="relative group aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 cursor-pointer"
        onClick={() => onOpen(index)}
      >
        {isVideoItem(item) ? (
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
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        {isVideoItem(item) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
        {/* Mobilde hover yok — buton orada hep görünür */}
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
      </div>
    ))}
  </div>
  );
};

export default MediaGrid;
