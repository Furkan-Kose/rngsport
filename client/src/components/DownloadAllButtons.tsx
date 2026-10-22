import { FolderDown, Loader2, Shrink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatFileSize, type DownloadSizes, type MediaQuality } from "../lib/media";

interface DownloadAllButtonsProps {
  sizes: DownloadSizes | null;
  album?: boolean; // "Albümü indir" metni
  progress: { done: number; total: number } | null;
  runningQuality: MediaQuality | null;
  onStart: (quality: MediaQuality) => void;
  primaryClassName: string;
}

// "Tümünü indir": önizlemeler varsa orijinal + "telefon için" iki seçenek, boyutlarıyla.
// Müşteri galerisi ve ödül törenleri ortak.
const DownloadAllButtons = ({
  sizes,
  album = false,
  progress,
  runningQuality,
  onStart,
  primaryClassName,
}: DownloadAllButtonsProps) => {
  const { t } = useTranslation();
  const isRunning = progress !== null;

  const label = (quality: MediaQuality) => {
    if (progress && runningQuality === quality) {
      return progress.total
        ? t("pages.media.preparingProgress", { done: progress.done, total: progress.total })
        : t("pages.media.preparing");
    }
    if (!sizes?.hasPreview) return t(album ? "pages.media.downloadAlbum" : "pages.media.downloadAll");
    const size = formatFileSize(quality === "preview" ? sizes.preview : sizes.original);
    const key = `${album ? "album" : "zip"}${quality === "preview" ? "Small" : "Original"}`;
    return t(`pages.media.${key}`, { size });
  };

  const icon = (quality: MediaQuality) =>
    isRunning && runningQuality === quality ? (
      <Loader2 className="w-4 h-4 animate-spin" />
    ) : quality === "preview" ? (
      <Shrink className="w-4 h-4" />
    ) : (
      <FolderDown className="w-4 h-4" />
    );

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => onStart("original")} disabled={isRunning} className={primaryClassName}>
        {icon("original")}
        {label("original")}
      </button>
      {sizes?.hasPreview && (
        <button
          onClick={() => onStart("preview")}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl disabled:opacity-70 bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-emerald-500/50 text-zinc-300 hover:text-emerald-400 text-sm font-medium transition-all duration-300"
        >
          {icon("preview")}
          {label("preview")}
        </button>
      )}
    </div>
  );
};

export default DownloadAllButtons;
