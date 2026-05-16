import { useEffect, useState } from 'react';
import { Loader2, RotateCcw, Save, X } from 'lucide-react';
import api from '../../lib/api';

export interface ShootingEntry {
  id: string;
  athleteName: string;
  expectedTime: string | null;
  shootStartedAt: string | null;
  shootEndedAt: string | null;
}

interface Props {
  entry: ShootingEntry | null;
  onClose: () => void;
  onSaved: () => void;
}

// ISO datetime → datetime-local input value (yyyy-MM-ddTHH:mm)
const toLocalInput = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const ShootingTimeEditModal = ({ entry, onClose, onSaved }: Props) => {
  const [expectedTime, setExpectedTime] = useState('');
  const [startedAt, setStartedAt] = useState('');
  const [endedAt, setEndedAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!entry) return;
    setExpectedTime(entry.expectedTime ?? '');
    setStartedAt(toLocalInput(entry.shootStartedAt));
    setEndedAt(toLocalInput(entry.shootEndedAt));
    setError('');
  }, [entry]);

  if (!entry) return null;

  const buildPayload = () => ({
    expectedTime: expectedTime.trim() || null,
    startedAt: startedAt ? new Date(startedAt).toISOString() : null,
    endedAt: endedAt ? new Date(endedAt).toISOString() : null,
  });

  const handleSave = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await api.patch(`/api/shooting-list/${entry.id}`, buildPayload());
      onSaved();
      onClose();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Bir hata oluştu';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await api.patch(`/api/shooting-list/${entry.id}`, {
        action: 'reset',
      });
      onSaved();
      onClose();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Bir hata oluştu';
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
            <h2 className="text-lg font-semibold text-white">Saatleri Düzenle</h2>
            <p className="text-xs text-gray-400 mt-0.5">{entry.athleteName}</p>
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
            <label className="text-xs text-gray-400 mb-1 block">
              Beklenen Çıkış (Excel'den)
            </label>
            <input
              type="text"
              value={expectedTime}
              onChange={(e) => setExpectedTime(e.target.value)}
              placeholder="Örn: 14:23"
              className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Başlangıç</label>
            <input
              type="datetime-local"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Bitiş</label>
            <input
              type="datetime-local"
              value={endedAt}
              onChange={(e) => setEndedAt(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="p-5 border-t border-gray-700 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            Saatleri Sıfırla
          </button>
          <div className="hidden sm:block flex-1" />
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
            onClick={handleSave}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShootingTimeEditModal;
