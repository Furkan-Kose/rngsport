import { useEffect, useRef, useState } from 'react';
import { FileSpreadsheet, Loader2, Upload, X } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-toastify';

interface UploadSummary {
  total: number;
  willBeShot: number;
  willNotBeShot: number;
  unmatched: { name: string; club: string | null }[];
}

interface Props {
  open: boolean;
  // Doluysa mevcut günün üzerine yazma modu; boşsa yeni gün oluşturma modu
  existingDay: { id: string; label: string } | null;
  onClose: () => void;
  onUploaded: (dayId: string) => void;
}

const UploadDayModal = ({ open, existingDay, onClose, onUploaded }: Props) => {
  const [label, setLabel] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setLabel(existingDay?.label ?? '');
    setFile(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [open, existingDay]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!label.trim()) {
      setError('Gün adı gerekli');
      return;
    }
    if (!file) {
      setError('Excel dosyası seçin');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('label', label.trim());
      if (existingDay) formData.append('dayId', existingDay.id);

      const { data } = await api.post('/api/shooting-list/upload', formData);
      const summary: UploadSummary = data.summary;
      toast.success(
        `${summary.total} sporcu yüklendi · ${summary.willBeShot} çekilecek · ${summary.willNotBeShot} çekilmeyecek`,
      );
      onUploaded(data.dayId);
      onClose();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Excel yüklenemedi';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md">
        <div className="p-5 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {existingDay ? 'Günü Yeniden Yükle' : 'Yeni Gün Yükle'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {existingDay
                ? 'Bu günün listesi yeni Excel ile değiştirilecek'
                : 'Yarışmanın bir günü için Excel yükleyin'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Gün Adı</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Örn: 1. Gün, 2. Gün - Final, 23 Mayıs"
              className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Excel Dosyası</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full inline-flex items-center gap-2 px-3 py-2.5 bg-gray-900/50 border border-gray-700 border-dashed rounded-lg text-sm text-gray-300 hover:border-amber-500 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">
                {file ? file.name : 'Dosya seçmek için tıklayın (.xlsx / .xls)'}
              </span>
            </button>
          </div>
        </div>

        <div className="p-5 border-t border-gray-700 flex gap-2">
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Yükle
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadDayModal;
