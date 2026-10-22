import { useState } from 'react';
import { toast } from 'react-toastify';
import { ImagePlus, Loader2 } from 'lucide-react';
import { uploadImageVariants, type VariantTargets } from '../../lib/imageVariants';

export interface MissingPreviewFile extends VariantTargets {
  id: string;
  fileName: string;
  url: string; // orijinalin okuma linki
}

interface PreviewBackfillProps {
  missing: number;
  // Sıradaki önizlemesiz dosyalar (sunucu parça parça verir)
  fetchBatch: () => Promise<{ remaining: number; files: MissingPreviewFile[] }>;
  save: (files: { id: string; previewSize: number }[]) => Promise<void>;
  onDone: () => void;
}

const CONCURRENCY = 3;

// Önizleme özelliğinden önce yüklenmiş fotoğraflar için tek seferlik işlem: orijinal
// R2'den doğrudan indirilir (Railway'den geçmez), tarayıcıda önizleme üretilip yüklenir.
const PreviewBackfill = ({ missing, fetchBatch, save, onDone }: PreviewBackfillProps) => {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  if (missing === 0 && !running) return null;

  const processFile = async (file: MissingPreviewFile) => {
    const response = await fetch(file.url);
    if (!response.ok) throw new Error(`İndirilemedi: ${file.fileName}`);
    const variants = await uploadImageVariants(await response.blob(), file);
    return variants ? { id: file.id, previewSize: variants.previewSize } : null;
  };

  const run = async () => {
    setRunning(true);
    setProgress({ done: 0, total: missing });
    let done = 0;
    let failed = 0;
    try {
      for (;;) {
        const { files } = await fetchBatch();
        if (files.length === 0) break;

        const saved: { id: string; previewSize: number }[] = [];
        let index = 0;
        const worker = async () => {
          while (index < files.length) {
            const file = files[index++];
            const result = await processFile(file).catch((error) => {
              console.error('Önizleme hatası:', error);
              return null;
            });
            if (result) saved.push(result);
            else failed += 1;
            done += 1;
            setProgress((prev) => ({ ...prev, done }));
          }
        };
        await Promise.all(Array.from({ length: Math.min(CONCURRENCY, files.length) }, worker));

        if (saved.length > 0) await save(saved);
        // Bu parçada hiçbiri olmadıysa sonrakiler de aynı dosyalar: döngüye girme
        if (saved.length === 0) break;
      }
      if (failed > 0) toast.warning(`${failed} dosyanın önizlemesi oluşturulamadı (orijinali gösterilir)`);
      else toast.success('Önizlemeler oluşturuldu');
    } catch (error) {
      console.error('Önizleme oluşturma hatası:', error);
      toast.error('Önizleme oluşturma yarıda kaldı, tekrar deneyebilirsiniz');
    } finally {
      setRunning(false);
      onDone();
    }
  };

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="text-sm text-amber-200">
        {running ? (
          <>Önizlemeler oluşturuluyor: {progress.done} / {progress.total}. Sayfayı kapatmayın.</>
        ) : (
          <>
            <span className="font-semibold">{missing}</span> fotoğrafın önizlemesi yok. Sitede orijinal
            boyutla açıldıkları için yavaş yüklenir.
          </>
        )}
      </div>
      <button
        onClick={run}
        disabled={running}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
      >
        {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
        Önizlemeleri oluştur
      </button>
    </div>
  );
};

export default PreviewBackfill;
