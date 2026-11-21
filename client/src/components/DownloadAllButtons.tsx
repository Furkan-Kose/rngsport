import { useEffect, useRef, useState } from "react";
import { ChevronDown, FolderDown, Loader2, Shrink } from "lucide-react";
import Modal from "./ui/Modal";
import { Button } from "./ui/kit";
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
  /** false: sunucu zip'i yok (paylaşım linki) — telefondaki "arka planda iner" onayı anlamsız */
  serverFallback?: boolean;
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
  serverFallback = true,
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
    if (serverFallback && isMobileDevice() && sizeOf(q) > memoryZipLimit()) setConfirm(q);
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
          type="button"
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
          <div role="menu" className="absolute right-0 mt-2 z-30 w-72 max-w-[calc(100vw-2rem)] bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-lg shadow-black/40">
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
                  <span className="block text-sm text-zinc-400">
                    {q === "preview" ? t("pages.media.menu.smallHint") : t("pages.media.menu.originalHint")}
                  </span>
                </span>
                <span className="text-sm text-zinc-400">{formatFileSize(sizeOf(q))}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        size="sm"
        title={confirm ? t("pages.media.confirm.title", { size: formatFileSize(sizeOf(confirm)) }) : ""}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              {t("pages.media.confirm.cancel")}
            </Button>
            <Button
              onClick={() => {
                const q = confirm;
                setConfirm(null);
                if (q) onStart(q);
              }}
            >
              {t("pages.media.confirm.start")}
            </Button>
          </>
        }
      >
        {confirm && (
          <ul className="text-zinc-300 space-y-1.5 list-disc pl-5">
            <li>{t("pages.media.confirm.wifi")}</li>
            <li>{t("pages.media.confirm.space", { size: formatFileSize(sizeOf(confirm)) })}</li>
            <li>{t("pages.media.confirm.background")}</li>
            {isIOS() && <li>{t("pages.media.confirm.ios")}</li>}
          </ul>
        )}
      </Modal>
    </>
  );
};

export default DownloadAllButtons;
