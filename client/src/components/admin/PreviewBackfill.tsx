import { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { ImagePlus, Loader2, Square } from 'lucide-react';
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
  const [stopping, setStopping] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  // Durdur: işlenmekte olan dosyalar bitip kaydedilir, yenisine başlanmaz
  const stopRef = useRef(false);

  if (missing === 0 && !running) return null;

  const processFile = async (file: MissingPreviewFile) => {
    const response = await fetch(file.url);
    if (!response.ok) throw new Error(`İndirilemedi: ${file.fileName}`);
    const variants = await uploadImageVariants(await response.blob(), file);
    return variants ? { id: file.id, previewSize: variants.previewSize ?? 0 } : null;
  };

  const run = async () => {
    stopRef.current = false;
    setStopping(false);
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
          while (index < files.length && !stopRef.current) {
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
        if (stopRef.current) break;
        // Bu parçada hiçbiri olmadıysa sonrakiler de aynı dosyalar: döngüye girme
        if (saved.length === 0) break;
      }
      if (stopRef.current) toast.info('Durduruldu. Tekrar basınca kalan fotoğraflardan devam eder');
      else if (failed > 0) toast.warning(`${failed} dosyanın önizlemesi oluşturulamadı (orijinali gösterilir)`);
      else toast.success('Önizlemeler oluşturuldu');
    } catch (error) {
      console.error('Önizleme oluşturma hatası:', error);
      toast.error('Önizleme oluşturma yarıda kaldı, tekrar deneyebilirsiniz');
    } finally {
      setRunning(false);
      setStopping(false);
      onDone();
    }
  };

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="text-sm text-amber-200">
        {running ? (
          <>
            {stopping ? 'Durduruluyor, işlenen fotoğraflar kaydediliyor' : 'Önizlemeler oluşturuluyor'}:{' '}
            {progress.done} / {progress.total}. Sayfayı kapatmayın.
          </>
        ) : (
          <>
            <span className="font-semibold">{missing}</span> fotoğrafın önizlemesi yok. Sitede orijinal
            boyutla açıldıkları için yavaş yüklenir.
          </>
        )}
      </div>
      {running ? (
        <button
          onClick={() => {
            stopRef.current = true;
            setStopping(true);
          }}
          disabled={stopping}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {stopping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
          Durdur
        </button>
      ) : (
        <button
          onClick={run}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors"
        >
          <ImagePlus className="w-4 h-4" />
          Önizlemeleri oluştur
        </button>
      )}
    </div>
  );
};

export default PreviewBackfill;
