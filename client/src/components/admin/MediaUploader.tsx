import { useRef, useState, type ReactNode } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Loader2, Upload, X } from 'lucide-react';
import { uploadImageVariants, uploadVideoPoster, type UploadedVariants, type VariantTargets } from '../../lib/imageVariants';
import { formatFileSize } from '../../lib/media';

// Görsellerde önizleme yükleme linkleri de gelir (bkz. lib/imageVariants)
export interface PresignedFile extends VariantTargets {
  key: string;
  fileName: string;
  uploadUrl: string;
}

export interface UploadedFile extends Partial<UploadedVariants> {
  key: string;
  fileName: string;
  size: number;
  contentType: string;
}

export interface FileMeta {
  fileName: string;
  contentType: string;
  size: number;
}

const UPLOAD_CONCURRENCY = 5;
// Sunucu tek istekte en fazla 100 dosya kabul ediyor (utils/uploads.js MAX_FILES_PER_BATCH).
// Seçimde sınır yok: dosyalar 100'erli gruplar halinde sırayla yüklenir, her grup ayrı kaydedilir.
const SERVER_BATCH = 100;

// Dosyaları en fazla UPLOAD_CONCURRENCY paralellikle R2'ye PUT eder;
// başarılı olanların metadata'sını döner. presigned[i] ↔ files[i] (sunucu sırayı korur) —
// ada göre eşleştirme, farklı klasörlerden aynı adlı iki dosyayı karıştırıyordu.
const uploadWithPool = async (
  presigned: PresignedFile[],
  files: File[],
  onProgress: () => void
) => {
  const succeeded: UploadedFile[] = [];
  const failed: string[] = [];
  let index = 0;

  const worker = async () => {
    while (index < presigned.length) {
      const i = index++;
      const item = presigned[i];
      const file = files[i];
      if (!file) continue;
      try {
        // Plain axios: api singleton'ı withCredentials gönderir, R2'ye cookie gitmemeli
        await axios.put(item.uploadUrl, file, {
          headers: { 'Content-Type': file.type },
        });
        // Önizlemeler yerel dosyadan üretilir (görsel: 2 sürüm, video: kapak resmi);
        // üretilemezse dosya önizlemesiz kaydedilir
        const variants = file.type.startsWith('image/')
          ? await uploadImageVariants(file, item)
          : file.type.startsWith('video/')
            ? await uploadVideoPoster(file, item)
            : null;
        succeeded.push({
          key: item.key,
          fileName: item.fileName,
          size: file.size,
          contentType: file.type,
          ...variants,
        });
      } catch (error) {
        console.error(`Yükleme hatası (${item.fileName}):`, error);
        failed.push(item.fileName);
      } finally {
        onProgress();
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(UPLOAD_CONCURRENCY, presigned.length) }, worker)
  );

  return { succeeded, failed };
};

interface MediaUploaderProps {
  // 1) imzalı PUT URL'leri al  2) tarayıcı → R2  3) başarılıları DB'ye kaydet
  presign: (files: FileMeta[]) => Promise<PresignedFile[]>;
  confirm: (files: UploadedFile[]) => Promise<void>;
  onUploaded: () => void;
  // Dosya alanının solunda gösterilecek ek alan (ör. albüm adı)
  renderFields?: (isUploading: boolean) => ReactNode;
}

// Admin galerilerinin ortak sürükle-bırak yükleme paneli (direkt R2 yükleme)
const MediaUploader = ({ presign, confirm, onUploaded, renderFields }: MediaUploaderProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearSelection = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter((f) =>
      /\.(jpe?g|png|webp|mp4|mov|webm)$/i.test(f.name)
    );
    const skipped = files.length - valid.length;
    if (skipped > 0) {
      toast.warning(`${skipped} dosya atlandı (jpg/png/webp/mp4/mov/webm)`);
    }
    setSelectedFiles(valid);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    const total = selectedFiles.length;
    setIsUploading(true);
    setUploadProgress({ done: 0, total });

    let done = 0;
    let uploaded = 0;
    const failed: string[] = [];
    try {
      for (let start = 0; start < total; start += SERVER_BATCH) {
        const batch = selectedFiles.slice(start, start + SERVER_BATCH);
        const presigned = await presign(
          batch.map((f) => ({ fileName: f.name, contentType: f.type, size: f.size }))
        );
        const result = await uploadWithPool(presigned, batch, () => {
          done += 1;
          setUploadProgress({ done, total });
        });
        // Her grup hemen kaydedilir: sonraki grupta hata olsa da yüklenenler kaybolmaz
        if (result.succeeded.length > 0) {
          await confirm(result.succeeded);
          uploaded += result.succeeded.length;
        }
        failed.push(...result.failed);
      }

      if (uploaded > 0) toast.success(`${uploaded} dosya yüklendi`);
      if (failed.length > 0) {
        toast.error(`${failed.length} dosya yüklenemedi: ${failed.slice(0, 3).join(', ')}${failed.length > 3 ? '...' : ''}`);
      }
      clearSelection();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Yükleme sırasında hata oluştu';
      toast.error(uploaded > 0 ? `${message} (${uploaded} dosya yüklendi, kalanlar yüklenmedi)` : message);
    } finally {
      setIsUploading(false);
      onUploaded();
    }
  };

  const totalSelectedSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 mb-6">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-amber-500" />
        Fotoğraf Yükle
      </h2>

      <div className={`grid gap-4 mb-4 ${renderFields ? 'sm:grid-cols-2' : ''}`}>
        {renderFields?.(isUploading)}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Dosyalar (foto: jpg/png/webp ≤50MB · video: mp4/mov/webm ≤1GB · sayı sınırı yok)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={isUploading}
            className="hidden"
          />
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              if (!isUploading) setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (!isUploading) handleFileSelect(e.dataTransfer.files);
            }}
            className={`flex flex-col items-center justify-center gap-1.5 px-4 py-5 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
              isDragging
                ? 'border-amber-500 bg-amber-500/5'
                : 'border-gray-600 hover:border-amber-500/50 bg-gray-900/30'
            } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Upload className={`w-5 h-5 ${isDragging ? 'text-amber-400' : 'text-gray-500'}`} />
            <p className="text-sm text-gray-400 text-center">
              {isDragging ? (
                <span className="text-amber-400 font-medium">Dosyaları bırakın</span>
              ) : (
                <>
                  Dosyaları buraya <span className="text-amber-400">sürükleyin</span> veya{' '}
                  <span className="text-amber-400">tıklayın</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mb-4 text-sm text-gray-300">
          <span className="font-medium text-white">{selectedFiles.length}</span> dosya seçildi
          ({formatFileSize(totalSelectedSize)})
          {!isUploading && (
            <button
              onClick={clearSelection}
              className="ml-3 text-gray-500 hover:text-red-400 transition-colors"
            >
              <X className="w-4 h-4 inline" /> Temizle
            </button>
          )}
        </div>
      )}

      {isUploading && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Yükleniyor...</span>
            <span>
              {uploadProgress.done} / {uploadProgress.total}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{
                width: `${uploadProgress.total ? (uploadProgress.done / uploadProgress.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={isUploading || selectedFiles.length === 0}
        className="px-6 py-2.5 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Yükleniyor...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Yüklemeyi Başlat
          </>
        )}
      </button>
    </div>
  );
};

export default MediaUploader;
