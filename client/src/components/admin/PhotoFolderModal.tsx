import { useEffect, useState } from 'react';
import { Folder, Loader2, RotateCcw, Save, X } from 'lucide-react';
import api from '../../lib/api';

export interface PhotoFolderEntry {
  id: string;
  athleteName: string;
  photoFolder: number | null;
  photoFolderEdited: boolean;
}

interface Props {
  entry: PhotoFolderEntry | null;
  /** Sayfanın SSE kimliği — kendi yankısıyla ikinci kez yüklenmesin */
  clientId: string;
  onClose: () => void;
  onSaved: () => void;
}

const errorMessage = (err: unknown) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
  'Bir hata oluştu';

// Foto klasör numarası düzeltme. Girilen numara o satırdan itibaren yeni başlangıç olur:
// sonraki çekilen sporcular kendiliğinden +1 +1 kayar (backend: computePhotoFolders).
const PhotoFolderModal = ({ entry, clientId, onClose, onSaved }: Props) => {
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!entry) return;
    setValue(entry.photoFolder != null ? String(entry.photoFolder) : '');
    setError('');
  }, [entry]);

  if (!entry) return null;

  const save = async (photoFolder: number | null) => {
    setIsSubmitting(true);
    setError('');
    try {
      await api.patch(`/api/shooting-list/${entry.id}`, { track: 'photo', photoFolder, clientId });
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1 || n > 9999) {
      setError('Geçerli bir klasör numarası girin');
      return;
    }
    void save(n);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Folder className="w-4 h-4 text-amber-400" />
            Foto Klasörü
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-gray-300">{entry.athleteName}</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-400 mb-1">Klasör numarası</label>
            <input
              type="number"
              min={1}
              max={9999}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-lg font-semibold focus:outline-none focus:border-amber-500"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Bu sporcudan sonra çekilenlerin klasörleri buna göre kendiliğinden sıralanır.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Kaydet
            </button>
            {entry.photoFolderEdited && (
              <button
                type="button"
                onClick={() => void save(null)}
                disabled={isSubmitting}
                title="Elle girilen numarayı kaldır, sıradaki numarayı otomatik al"
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-700/60 hover:bg-gray-700 text-gray-200 text-sm disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                Otomatik'e döndür
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default PhotoFolderModal;
