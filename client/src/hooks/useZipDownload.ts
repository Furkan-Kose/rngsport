import { useState } from "react";
import { toast } from "react-toastify";
import { downloadAllAsZip } from "../lib/zipDownload";
import i18n from "../i18n";

// "Tümünü İndir" butonunun durumu: ilerleme (12/80) + hata bildirimi
export const useZipDownload = () => {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const start = async (manifestPath: string, fallbackPath: string) => {
    if (progress) return; // zaten sürüyor
    setProgress({ done: 0, total: 0 });
    try {
      const result = await downloadAllAsZip({
        manifestPath,
        fallbackPath,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      if (result === "done") toast.success(i18n.t("pages.media.zipDone"));
      if (result === "server") toast.info(i18n.t("pages.media.zipServer"));
    } catch (error) {
      console.error("Zip indirme hatası:", error);
      toast.error(i18n.t("pages.media.zipFailed"));
    } finally {
      setProgress(null);
    }
  };

  return { start, progress, isRunning: progress !== null };
};
