import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { CheckCheck, Download, FolderDown, ImageDown, Loader2, Shrink, X } from "lucide-react";
import { toast } from "react-toastify";
import { canShareFiles, isIOS, isMobileDevice, keepScreenOn } from "../lib/device";
import { memoryZipLimit } from "../lib/zipDownload";
import { formatFileSize, isVideoItem, type MediaItem, type MediaQuality } from "../lib/media";
import { backdropClass, useDialog } from "./ui/Modal";
import { useBottomBar } from "../lib/bottomBar";
import { buttonClass, cx, iconButtonClass } from "../lib/siteUi";

// "Seç" modu: müşteri galerisi ve ödül törenleri ortak. Seçilenler ya zip olarak (doğrudan
// R2'den, tarayıcıda) iner ya da telefonda paylaşım menüsüyle doğrudan galeriye kaydedilir.
// İkisi de Railway'i kullanmaz. Seçim durumu: hooks/useMediaSelection.

// Bir dosyanın seçilen kalitedeki boyutu (videonun "küçük" sürümü yok → orijinal)
const sizeFor = (item: MediaItem, quality: MediaQuality) =>
  (quality === "preview" && item.previewUrl ? item.previewSize : item.size) ?? 0;

// ---------------------------------------------------------------------------
// Galeriye kaydet (telefon): tur tur hazırla → kullanıcı dokunur → paylaşım menüsü
// ---------------------------------------------------------------------------
const BATCH_MAX_FILES = 20;
const BATCH_MAX_BYTES = 100 * 1024 * 1024; // iPhone Safari belleği için güvenli üst sınır
const SHARE_VIDEO_MAX_BYTES = 250 * 1024 * 1024; // daha büyük video paylaşımla gönderilmez

const planBatches = (items: MediaItem[], quality: MediaQuality) => {
  const batches: MediaItem[][] = [];
  const skipped: MediaItem[] = [];
  let current: MediaItem[] = [];
  let bytes = 0;
  for (const item of items) {
    const size = sizeFor(item, quality);
    if (isVideoItem(item) && size > SHARE_VIDEO_MAX_BYTES) {
      skipped.push(item);
      continue;
    }
    if (current.length && (current.length >= BATCH_MAX_FILES || bytes + size > BATCH_MAX_BYTES)) {
      batches.push(current);
      current = [];
      bytes = 0;
    }
    current.push(item);
    bytes += size;
  }
  if (current.length) batches.push(current);
  return { batches, skipped };
};

interface SaveToPhotosProps {
  items: MediaItem[];
  quality: MediaQuality;
  /** Taze indirme linki (sunucudan, imzalı R2 linki) */
  getUrl: (item: MediaItem, quality: MediaQuality) => Promise<string>;
  onDownloadSingle: (item: MediaItem, quality: MediaQuality) => void;
  onClose: () => void;
}

const fileNameFor = (item: MediaItem, quality: MediaQuality) =>
  quality === "preview" && item.previewUrl && !isVideoItem(item)
    ? `${item.fileName.replace(/\.[^.]+$/, "")}-small.jpg`
    : item.fileName;

export const SaveToPhotosModal = ({ items, quality, getUrl, onDownloadSingle, onClose }: SaveToPhotosProps) => {
  const { t } = useTranslation();
  const { batches, skipped } = useMemo(() => planBatches(items, quality), [items, quality]);
  const [index, setIndex] = useState(0);
  const [files, setFiles] = useState<File[] | null>(null);
  const [prepared, setPrepared] = useState(0);
  const [error, setError] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [attempt, setAttempt] = useState(0); // "Tekrar dene" aynı turu yeniden hazırlar
  const done = index >= batches.length;

  // Pencere açıkken ekran kararmasın (kilitlenirse hazırlık yarıda kalır)
  useEffect(() => {
    let release = () => {};
    keepScreenOn().then((r) => (release = r));
    return () => release();
  }, []);

  // Sıradaki turun dosyalarını hazırla (sırayla — bellek tek seferde şişmesin)
  useEffect(() => {
    if (done) return;
    let alive = true;
    (async () => {
      setFiles(null);
      setPrepared(0);
      setError(false);
      try {
        const list: File[] = [];
        for (const item of batches[index]) {
          const response = await fetch(await getUrl(item, quality));
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const blob = await response.blob();
          const type = blob.type || item.contentType || "application/octet-stream";
          list.push(new File([blob], fileNameFor(item, quality), { type }));
          if (!alive) return;
          setPrepared((n) => n + 1);
        }
        if (alive) setFiles(list);
      } catch (err) {
        console.error("Galeriye kaydet hazırlığı:", err);
        if (alive) setError(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [index, batches, done, getUrl, quality, attempt]);

  // Paylaşım menüsü yalnızca dokunuşla açılabiliyor: dosyalar hazırken butona basılır
  const share = async () => {
    if (!files) return;
    setSharing(true);
    try {
      await navigator.share({ files });
      setFiles(null);
      setIndex((i) => i + 1);
    } catch (err) {
      const name = (err as Error).name;
      if (name !== "AbortError") {
        console.error("Paylaşım hatası:", err);
        toast.error(t("pages.media.save.shareError"));
      }
      // Vazgeçildiyse aynı tur tekrar denenebilir
    } finally {
      setSharing(false);
    }
  };

  const dialogRef = useDialog(true, onClose);
  const total = batches.length;
  const currentCount = batches[index]?.length ?? 0;

  return createPortal(
    <div className={cx(backdropClass, "flex items-end sm:items-center justify-center sm:p-4")}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-photos-title"
        tabIndex={-1}
        className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-t-2xl sm:rounded-2xl p-6 outline-none"
      >
        <button type="button" onClick={onClose} className={iconButtonClass("ghost", "absolute top-3 right-3")} aria-label={t("common.close")}>
          <X className="w-5 h-5" aria-hidden />
        </button>
        <h2 id="save-photos-title" className="text-lg font-bold text-white mb-1 pr-10">{t("pages.media.save.title")}</h2>
        <p className="text-sm text-zinc-400 mb-5">
          {isIOS() ? t("pages.media.save.hintIos") : t("pages.media.save.hintAndroid")}
        </p>

        {total > 0 && !done && (
          <>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-zinc-300">{t("pages.media.save.round", { n: index + 1, total })}</span>
              <span className="text-zinc-400">
                {files ? t("pages.media.save.ready", { count: currentCount }) : t("pages.media.save.preparing", { done: prepared, total: currentCount })}
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-5">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${((index + (files ? 1 : prepared / Math.max(1, currentCount))) / total) * 100}%` }} />
            </div>
            {error ? (
              <button
                onClick={() => setAttempt((a) => a + 1)}
                className={buttonClass("secondary", "lg", "w-full")}
              >
                {t("pages.media.save.retry")}
              </button>
            ) : (
              <button
                onClick={share}
                disabled={!files || sharing}
                className={buttonClass("primary", "lg", "w-full")}
              >
                {!files || sharing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageDown className="w-5 h-5" />}
                {files ? t("pages.media.save.button", { count: currentCount }) : t("pages.media.save.wait")}
              </button>
            )}
            <p className="text-sm text-zinc-400 mt-3 text-center">{t("pages.media.save.keepOpen")}</p>
          </>
        )}

        {done && total > 0 && (
          <p className="flex items-center gap-2 text-emerald-300 font-medium mb-4">
            <CheckCheck className="w-5 h-5" />
            {t("pages.media.save.done", { count: batches.flat().length })}
          </p>
        )}

        {skipped.length > 0 && (
          <div className="mt-5 border-t border-zinc-800 pt-4">
            <p className="text-sm text-zinc-300 mb-2">{t("pages.media.save.bigVideos")}</p>
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {skipped.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-zinc-400">
                    {item.fileName} · {formatFileSize(item.size)}
                  </span>
                  <button onClick={() => onDownloadSingle(item, "original")} className={buttonClass("link", "sm", "shrink-0")}>
                    <Download className="w-4 h-4" />
                    {t("pages.media.download")}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {done && (
          <button onClick={onClose} className={buttonClass("secondary", "lg", "w-full mt-5")}>
            {t("pages.media.save.close")}
          </button>
        )}
      </div>
    </div>,
    document.body
  );
};

// ---------------------------------------------------------------------------
// Seçim çubuğu (sayfanın altında sabit)
// ---------------------------------------------------------------------------
interface SelectionBarProps {
  items: MediaItem[]; // yüklü olanlar
  selectedIds: Set<string>;
  onSelectAll: () => void;
  onClear: () => void;
  onExit: () => void;
  onZip: (ids: string[], quality: MediaQuality) => void;
  zipRunning: boolean;
  zipProgress: { done: number; total: number } | null;
  getUrl: (item: MediaItem, quality: MediaQuality) => Promise<string>;
  onDownloadSingle: (item: MediaItem, quality: MediaQuality) => void;
  /** Sayfada henüz yüklenmemiş dosya varsa "Tümünü seç" bunları kapsamaz — not gösterilir */
  hasMore: boolean;
}

export const SelectionBar = ({
  items,
  selectedIds,
  onSelectAll,
  onClear,
  onExit,
  onZip,
  zipRunning,
  zipProgress,
  getUrl,
  onDownloadSingle,
  hasMore,
}: SelectionBarProps) => {
  const { t } = useTranslation();
  const [quality, setQuality] = useState<MediaQuality>("original");
  const [saving, setSaving] = useState(false);
  const selectedItems = useMemo(() => items.filter((i) => selectedIds.has(i.id)), [items, selectedIds]);
  const count = selectedItems.length;
  const anyPreview = selectedItems.some((i) => i.previewUrl && !isVideoItem(i));
  const effectiveQuality: MediaQuality = anyPreview ? quality : "original";
  const totalBytes = selectedItems.reduce((sum, i) => sum + sizeFor(i, effectiveQuality), 0);
  const canSave = canShareFiles();
  // Telefonda tarayıcı zip'i bellek sınırlı: büyük seçimde zip yerine galeriye kaydet önerilir
  const zipTooBigHere = !("showSaveFilePicker" in window) && totalBytes > memoryZipLimit();
  // WhatsApp düğmesi çubuğun üstüne kaysın (indirme düğmesini kapatmasın)
  useBottomBar(true);

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4 pointer-events-none">
        <div className="pointer-events-auto max-w-3xl mx-auto bg-zinc-900 border border-zinc-700 rounded-2xl p-3 sm:p-4 shadow-lg shadow-black/40">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <p className="text-sm text-white font-medium">
              {t("pages.media.select.count", { count })}
              {count > 0 && <span className="text-zinc-400 font-normal"> · {formatFileSize(totalBytes)}</span>}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={count === items.length ? onClear : onSelectAll} className={buttonClass("secondary", "sm")}>
                {count === items.length ? t("pages.media.select.clear") : t("pages.media.select.all")}
              </button>
              <button type="button" onClick={onExit} className={iconButtonClass("ghost", "w-10 h-10")} aria-label={t("pages.media.select.exit")}>
                <X className="w-5 h-5" aria-hidden />
              </button>
            </div>
          </div>

          {/* Tek ana buton: telefonda "Galeriye kaydet", bilgisayarda "Seçilenleri indir" */}
          {canSave ? (
            <div className="flex flex-col items-stretch gap-2">
              <button
                disabled={count === 0}
                onClick={() => setSaving(true)}
                className={buttonClass("primary", "lg")}
              >
                <ImageDown className="w-4 h-4" />
                {t("pages.media.select.saveToGallery")}
              </button>
              <button
                disabled={count === 0 || zipRunning || zipTooBigHere}
                onClick={() => onZip(selectedItems.map((i) => i.id), effectiveQuality)}
                className={buttonClass("ghost", "md", "self-center underline underline-offset-4 disabled:no-underline")}
              >
                {zipRunning && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {zipRunning && zipProgress?.total
                  ? t("pages.media.preparingProgress", { done: zipProgress.done, total: zipProgress.total })
                  : t("pages.media.select.zipLink")}
              </button>
            </div>
          ) : (
            <button
              disabled={count === 0 || zipRunning || zipTooBigHere}
              onClick={() => onZip(selectedItems.map((i) => i.id), effectiveQuality)}
              className={buttonClass("primary", "lg", "w-full")}
            >
              {zipRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : effectiveQuality === "preview" ? <Shrink className="w-4 h-4" /> : <FolderDown className="w-4 h-4" />}
              {zipRunning && zipProgress?.total
                ? t("pages.media.preparingProgress", { done: zipProgress.done, total: zipProgress.total })
                : t("pages.media.select.downloadZip")}
            </button>
          )}

          {anyPreview && (
            <label className="mt-2 flex items-center justify-center gap-2 min-h-10 text-sm text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={quality === "preview"}
                onChange={(e) => setQuality(e.target.checked ? "preview" : "original")}
                className="w-5 h-5 accent-emerald-500"
              />
              {t("pages.media.select.smallQuality")}
            </label>
          )}
          {zipTooBigHere && count > 0 && (
            <p className="text-sm text-amber-300 mt-2">
              {canSave ? t("pages.media.select.tooBigPhone") : t("pages.media.select.tooBigBrowser", { size: formatFileSize(memoryZipLimit()) })}
            </p>
          )}
          {hasMore && <p className="text-sm text-zinc-400 mt-2">{t("pages.media.select.loadedOnly")}</p>}
        </div>
      </div>

      {saving && (
        <SaveToPhotosModal
          items={selectedItems}
          quality={effectiveQuality}
          getUrl={getUrl}
          onDownloadSingle={onDownloadSingle}
          onClose={() => setSaving(false)}
        />
      )}
    </>
  );
};

/** Cihaza göre doğru indirme açıklaması (iPhone'da indirilen dosya Fotoğraflar'a değil Dosyalar'a gider) */
// Büyük indirme ayrıntısı (Wi-Fi, boş yer) "Tümünü indir" onay penceresinde
export const DownloadHint = () => {
  const { t } = useTranslation();
  if (!isMobileDevice()) return null;
  return <p className="text-sm text-zinc-400 mb-4">{isIOS() ? t("pages.media.hint.ios") : t("pages.media.hint.android")}</p>;
};
