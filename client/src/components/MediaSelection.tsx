import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { CheckCheck, Download, FolderDown, ImageDown, Loader2, Shrink, X } from "lucide-react";
import { toast } from "react-toastify";
import { canShareFiles, isIOS, isMobileDevice, keepScreenOn } from "../lib/device";
import { memoryZipLimit } from "../lib/zipDownload";
import { formatFileSize, isVideoItem, type MediaItem, type MediaQuality } from "../lib/media";

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

  const total = batches.length;
  const currentCount = batches[index]?.length ?? 0;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div role="dialog" aria-modal="true" className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10" aria-label={t("pages.shop.promo.close")}>
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-white mb-1 pr-8">{t("pages.media.save.title")}</h2>
        <p className="text-sm text-zinc-400 mb-5">
          {isIOS() ? t("pages.media.save.hintIos") : t("pages.media.save.hintAndroid")}
        </p>

        {total > 0 && !done && (
          <>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-zinc-300">{t("pages.media.save.round", { n: index + 1, total })}</span>
              <span className="text-zinc-500">
                {files ? t("pages.media.save.ready", { count: currentCount }) : t("pages.media.save.preparing", { done: prepared, total: currentCount })}
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-5">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${((index + (files ? 1 : prepared / Math.max(1, currentCount))) / total) * 100}%` }} />
            </div>
            {error ? (
              <button
                onClick={() => setAttempt((a) => a + 1)}
                className="w-full px-5 py-3 rounded-xl bg-zinc-800 text-zinc-200 font-medium"
              >
                {t("pages.media.save.retry")}
              </button>
            ) : (
              <button
                onClick={share}
                disabled={!files || sharing}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold"
              >
                {!files || sharing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageDown className="w-5 h-5" />}
                {files ? t("pages.media.save.button", { count: currentCount }) : t("pages.media.save.wait")}
              </button>
            )}
            <p className="text-xs text-zinc-500 mt-3 text-center">{t("pages.media.save.keepOpen")}</p>
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
                  <button onClick={() => onDownloadSingle(item, "original")} className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 shrink-0">
                    <Download className="w-4 h-4" />
                    {t("pages.media.download")}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {done && (
          <button onClick={onClose} className="w-full mt-5 px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium">
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

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4 pointer-events-none">
        <div className="pointer-events-auto max-w-3xl mx-auto bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 rounded-2xl shadow-2xl p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <p className="text-sm text-white font-medium">
              {t("pages.media.select.count", { count })}
              {count > 0 && <span className="text-zinc-400 font-normal"> · {formatFileSize(totalBytes)}</span>}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={count === items.length ? onClear : onSelectAll} className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700">
                {count === items.length ? t("pages.media.select.clear") : t("pages.media.select.all")}
              </button>
              <button onClick={onExit} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10" aria-label={t("pages.media.select.exit")}>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tek ana buton: telefonda "Galeriye kaydet", bilgisayarda "Seçilenleri indir" */}
          {canSave ? (
            <div className="flex flex-col items-stretch gap-2">
              <button
                disabled={count === 0}
                onClick={() => setSaving(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white text-sm font-semibold"
              >
                <ImageDown className="w-4 h-4" />
                {t("pages.media.select.saveToGallery")}
              </button>
              <button
                disabled={count === 0 || zipRunning || zipTooBigHere}
                onClick={() => onZip(selectedItems.map((i) => i.id), effectiveQuality)}
                className="self-center inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 underline underline-offset-4 disabled:opacity-40 disabled:no-underline"
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
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white text-sm font-semibold"
            >
              {zipRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : effectiveQuality === "preview" ? <Shrink className="w-4 h-4" /> : <FolderDown className="w-4 h-4" />}
              {zipRunning && zipProgress?.total
                ? t("pages.media.preparingProgress", { done: zipProgress.done, total: zipProgress.total })
                : t("pages.media.select.downloadZip")}
            </button>
          )}

          {anyPreview && (
            <label className="mt-2 flex items-center justify-center gap-2 text-xs text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={quality === "preview"}
                onChange={(e) => setQuality(e.target.checked ? "preview" : "original")}
                className="accent-emerald-500"
              />
              {t("pages.media.select.smallQuality")}
            </label>
          )}
          {zipTooBigHere && count > 0 && (
            <p className="text-xs text-amber-300 mt-2">
              {canSave ? t("pages.media.select.tooBigPhone") : t("pages.media.select.tooBigBrowser", { size: formatFileSize(memoryZipLimit()) })}
            </p>
          )}
          {hasMore && <p className="text-xs text-zinc-500 mt-2">{t("pages.media.select.loadedOnly")}</p>}
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
  return <p className="text-xs text-zinc-400 mb-4">{isIOS() ? t("pages.media.hint.ios") : t("pages.media.hint.android")}</p>;
};
