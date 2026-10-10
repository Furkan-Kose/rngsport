import { useState } from "react";
import { toast } from "react-toastify";
import { downloadAllAsZip } from "../lib/zipDownload";

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
      if (result === "done") toast.success("Zip dosyası indirildi");
      if (result === "server") toast.info("Galeri büyük olduğu için zip sunucudan hazırlanıyor, indirme birazdan başlayacak");
    } catch (error) {
      console.error("Zip indirme hatası:", error);
      toast.error("Toplu indirme yarıda kaldı. Lütfen tekrar deneyin veya dosyaları tek tek indirin.");
    } finally {
      setProgress(null);
    }
  };

  return { start, progress, isRunning: progress !== null };
};
