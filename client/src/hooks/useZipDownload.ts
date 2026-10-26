import { useState } from "react";
import { toast } from "react-toastify";
import { downloadAllAsZip, ZipTooLargeError } from "../lib/zipDownload";
import { formatFileSize } from "../lib/media";
import i18n from "../i18n";

// "Tümünü İndir" / "Seçilenleri indir" butonlarının durumu: ilerleme (12/80) + hata bildirimi
export const useZipDownload = () => {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  // ids verilirse yalnızca seçilenler (sunucu yedek yolu yok — fallbackPath verilmez)
  const start = async (manifestPath: string, fallbackPath?: string, ids?: string[]) => {
    if (progress) return; // zaten sürüyor
    setProgress({ done: 0, total: 0 });
    try {
      const result = await downloadAllAsZip({
        manifestPath,
        fallbackPath,
        ids,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      if (result === "done") toast.success(i18n.t("pages.media.zipDone"));
      if (result === "server") toast.info(i18n.t("pages.media.zipServer"), { autoClose: 10000 });
    } catch (error) {
      if (error instanceof ZipTooLargeError) {
        toast.warning(i18n.t("pages.media.selectionTooLarge", { size: formatFileSize(error.totalSize) }), { autoClose: 10000 });
      } else {
        console.error("Zip indirme hatası:", error);
        toast.error(i18n.t("pages.media.zipFailed"));
      }
    } finally {
      setProgress(null);
    }
  };

  return { start, progress, isRunning: progress !== null };
};
