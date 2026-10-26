import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, FolderDown, Loader2, Shrink, Wifi } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatFileSize, type DownloadSizes, type MediaQuality } from "../lib/media";
import { isIOS, isMobileDevice } from "../lib/device";
import { memoryZipLimit } from "../lib/zipDownload";

interface DownloadAllButtonsProps {
  sizes: DownloadSizes | null;
  album?: boolean; // "Albümü indir" metni
  progress: { done: number; total: number } | null;
  onStart: (quality: MediaQuality) => void;
  primaryClassName: string;
}

// "Tümünü indir": TEK buton. Önizleme varsa açılan küçük menüde Orijinal / Küçük boyut
// (boyutlarıyla). Telefonda büyük indirmeden önce kısa bir onay penceresi: Wi-Fi, boş yer,
// arka planda sürdüğü ve iPhone'da Safari'nin kapatılmaması. Müşteri galerisi + ödül törenleri.
const DownloadAllButtons = ({
  sizes,
  album = false,
  progress,
  onStart,
  primaryClassName,
}: DownloadAllButtonsProps) => {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirm, setConfirm] = useState<MediaQuality | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isRunning = progress !== null;

  // Menü dışına dokununca kapansın
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [menuOpen]);

  const sizeOf = (q: MediaQuality) => (q === "preview" ? sizes?.preview : sizes?.original) ?? 0;

  const choose = (q: MediaQuality) => {
    setMenuOpen(false);
    // Telefonda tarayıcıya sığmayan indirme telefonun indirme yöneticisinde sürer: önce bilgilendir
    if (isMobileDevice() && sizeOf(q) > memoryZipLimit()) setConfirm(q);
    else onStart(q);
  };

  const title = t(album ? "pages.media.downloadAlbum" : "pages.media.downloadAll");
  const busyLabel = progress?.total
    ? t("pages.media.preparingProgress", { done: progress.done, total: progress.total })
    : t("pages.media.preparing");

  return (
    <>
      <div ref={menuRef} className="relative">
        <button
          onClick={() => (sizes?.hasPreview ? setMenuOpen((o) => !o) : choose("original"))}
          disabled={isRunning}
          aria-haspopup={sizes?.hasPreview ? "menu" : undefined}
          aria-expanded={sizes?.hasPreview ? menuOpen : undefined}
          className={primaryClassName}
        >
          {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderDown className="w-4 h-4" />}
          {isRunning ? busyLabel : title}
          {!isRunning && !sizes?.hasPreview && sizes?.original ? (
            <span className="opacity-75">· {formatFileSize(sizes.original)}</span>
          ) : null}
          {!isRunning && sizes?.hasPreview && <ChevronDown className="w-4 h-4" />}
        </button>

        {menuOpen && sizes?.hasPreview && (
          <div role="menu" className="absolute right-0 mt-2 z-30 w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
            {(["original", "preview"] as const).map((q) => (
              <button
                key={q}
                role="menuitem"
                onClick={() => choose(q)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-800 transition-colors"
              >
                {q === "preview" ? <Shrink className="w-4 h-4 text-zinc-400" /> : <FolderDown className="w-4 h-4 text-emerald-400" />}
                <span className="flex-1">
                  <span className="block text-sm text-white">
                    {q === "preview" ? t("pages.media.downloadSmall") : t("pages.media.downloadOriginal")}
                  </span>
                  <span className="block text-xs text-zinc-500">
                    {q === "preview" ? t("pages.media.menu.smallHint") : t("pages.media.menu.originalHint")}
                  </span>
                </span>
                <span className="text-xs text-zinc-400">{formatFileSize(sizeOf(q))}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {confirm &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/80 flex items-end sm:items-center justify-center p-4" onClick={() => setConfirm(null)}>
            <div role="dialog" aria-modal="true" className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mb-3">
                <Wifi className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">
                {t("pages.media.confirm.title", { size: formatFileSize(sizeOf(confirm)) })}
              </h2>
              <ul className="text-sm text-zinc-300 space-y-1.5 mb-5 list-disc pl-5">
                <li>{t("pages.media.confirm.wifi")}</li>
                <li>{t("pages.media.confirm.space", { size: formatFileSize(sizeOf(confirm)) })}</li>
                <li>{t("pages.media.confirm.background")}</li>
                {isIOS() && <li>{t("pages.media.confirm.ios")}</li>}
              </ul>
              <div className="flex gap-2">
                <button onClick={() => setConfirm(null)} className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium">
                  {t("pages.media.confirm.cancel")}
                </button>
                <button
                  onClick={() => {
                    const q = confirm;
                    setConfirm(null);
                    onStart(q);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                >
                  {t("pages.media.confirm.start")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default DownloadAllButtons;
