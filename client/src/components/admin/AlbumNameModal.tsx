import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import AlbumInput from './AlbumInput';

interface AlbumNameModalProps {
  title: string;
  description?: string;
  initialValue?: string;
  options: string[];
  confirmLabel: string;
  // İş sürerken ilerleme (taşıma R2'de kopyala-sil yaptığı için birkaç saniye sürebilir)
  progress: { done: number; total: number } | null;
  onSubmit: (album: string) => void;
  onCancel: () => void;
}

// Albüm adı soran küçük pencere: "Albüme taşı" ve "Albüm adını düzelt" için
const AlbumNameModal = ({
  title,
  description,
  initialValue = '',
  options,
  confirmLabel,
  progress,
  onSubmit,
  onCancel,
}: AlbumNameModalProps) => {
  const [value, setValue] = useState(initialValue);
  const busy = progress !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {!busy && (
            <button type="button" onClick={onCancel} className="p-1 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {description && <p className="text-sm text-gray-400 mb-4">{description}</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy) onSubmit(value);
          }}
        >
          <AlbumInput value={value} onChange={setValue} options={options} disabled={busy} autoFocus />
          <p className="text-xs text-gray-500 mt-2">Boş bırakılırsa dosyalar albümsüz (genel) olur.</p>

          {busy && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Taşınıyor…</span>
                <span>
                  {progress.done} / {progress.total}
                </span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="px-4 py-2 rounded-xl text-gray-300 hover:text-white disabled:opacity-50"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AlbumNameModal;
