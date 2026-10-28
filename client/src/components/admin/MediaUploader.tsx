import { useEffect, useRef, useState, type ReactNode } from 'react';
import { toast } from 'react-toastify';
import { Upload, X } from 'lucide-react';
import { formatFileSize } from '../../lib/media';
import {
  enqueueUpload,
  onUploadFinished,
  useUploadJobs,
  type FileMeta,
  type PresignedFile,
  type UploadedFile,
} from '../../lib/uploadQueue';

interface MediaUploaderProps {
  // 1) imzalı PUT URL'leri al  2) tarayıcı → R2  3) başarılıları DB'ye kaydet
  presign: (files: FileMeta[]) => Promise<PresignedFile[]>;
  confirm: (files: UploadedFile[]) => Promise<void>;
  // Sağ alttaki yükleme kutusunda görünen ad ve biten işi tanımak için hedef
  label: string;
  target: string;
  onUploaded: () => void;
  // Dosya alanının solunda gösterilecek ek alan (ör. albüm adı)
  renderFields?: () => ReactNode;
}

// Admin galerilerinin ortak sürükle-bırak yükleme paneli. Yükleme işi lib/uploadQueue'ya
// verilir: sayfadan çıkılsa da sürer, ilerleme sağ altta (UploadTray) görünür.
const MediaUploader = ({ presign, confirm, label, target, onUploaded, renderFields }: MediaUploaderProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jobs = useUploadJobs();
  const activeHere = jobs.filter((j) => j.target === target && (j.status === 'queued' || j.status === 'running'));

  // Bu sayfanın işi bitince listeyi yenile (sayfa açıksa)
  const onUploadedRef = useRef(onUploaded);
  useEffect(() => {
    onUploadedRef.current = onUploaded;
  });
  useEffect(() => onUploadFinished((t) => t === target && onUploadedRef.current()), [target]);

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

  // İş sıraya girer; alanlar hemen boşalır, bir sonraki yükleme hazırlanabilir
  const handleUpload = () => {
    if (selectedFiles.length === 0) return;
    enqueueUpload({ label, target, files: selectedFiles, presign, confirm });
    toast.info(`${selectedFiles.length} dosya yükleme sırasına alındı — başka sayfaya geçebilirsiniz`);
    clearSelection();
  };

  const totalSelectedSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 mb-6">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-amber-500" />
        Fotoğraf Yükle
      </h2>

      <div className={`grid gap-4 mb-4 ${renderFields ? 'sm:grid-cols-2' : ''}`}>
        {renderFields?.()}
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
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFileSelect(e.dataTransfer.files);
            }}
            className={`flex flex-col items-center justify-center gap-1.5 px-4 py-5 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
              isDragging
                ? 'border-amber-500 bg-amber-500/5'
                : 'border-gray-600 hover:border-amber-500/50 bg-gray-900/30'
            }`}
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
          <button
            onClick={clearSelection}
            className="ml-3 text-gray-500 hover:text-red-400 transition-colors"
          >
            <X className="w-4 h-4 inline" /> Temizle
          </button>
        </div>
      )}

      {activeHere.length > 0 && (
        <p className="mb-4 text-sm text-amber-300/90">
          Bu sayfa için {activeHere.length} yükleme sürüyor / sırada. İlerleme sağ alttaki kutuda görünür.
        </p>
      )}

      <button
        onClick={handleUpload}
        disabled={selectedFiles.length === 0}
        className="px-6 py-2.5 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <Upload className="w-4 h-4" />
        Yüklemeyi Başlat
      </button>
    </div>
  );
};

export default MediaUploader;
