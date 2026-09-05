import { useEffect, useState } from 'react';
import { Loader2, RotateCcw, Save, X } from 'lucide-react';
import api from '../../lib/api';
import { TRACK_LABELS } from '../../lib/roles';
import { trackTimes, type ShootTrack, type TrackTimestamps } from '../../lib/shooting';

export interface ShootingEntry extends TrackTimestamps {
  id: string;
  athleteName: string;
  expectedTime: string | null;
}

interface Props {
  entry: ShootingEntry | null;
  /** Düzenlenecek izler — personelde tek, admin "Tümü" görünümünde ikisi birden */
  tracks: ShootTrack[];
  /** "Beklenen Çıkış" sadece admin tarafından değiştirilebilir (backend de 403 döner) */
  canEditExpected: boolean;
  /** Sayfanın SSE kimliği — kendi yankısıyla ikinci kez yüklenmesin */
  clientId: string;
  onClose: () => void;
  onSaved: () => void;
}

// ISO datetime → datetime-local input value (yyyy-MM-ddTHH:mm:ss).
// Saniye dahil: çekimler 1-2 dakika sürüyor, dakikaya yuvarlamak veri kaybettirir.
const toLocalInput = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const toIso = (value: string) => (value ? new Date(value).toISOString() : null);

const errorMessage = (err: unknown) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
  'Bir hata oluştu';

const ShootingTimeEditModal = ({
  entry,
  tracks,
  canEditExpected,
  clientId,
  onClose,
  onSaved,
}: Props) => {
  const [expectedTime, setExpectedTime] = useState('');
  // İz başına { startedAt, endedAt } input değerleri
  const [times, setTimes] = useState<
    Record<string, { startedAt: string; endedAt: string }>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // tracks referansı her render'da yenilenebildiği için içeriğine göre karşılaştır
  const trackKey = tracks.join(',');

  useEffect(() => {
    if (!entry) return;
    setExpectedTime(entry.expectedTime ?? '');
    setTimes(
      Object.fromEntries(
        tracks.map((track) => {
          const { startedAt, endedAt } = trackTimes(entry, track);
          return [
            track,
            { startedAt: toLocalInput(startedAt), endedAt: toLocalInput(endedAt) },
          ];
        }),
      ),
    );
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- trackKey, tracks içeriğini temsil eder
  }, [entry, trackKey]);

  if (!entry) return null;

  const setField = (
    track: ShootTrack,
    field: 'startedAt' | 'endedAt',
    value: string,
  ) => setTimes((prev) => ({ ...prev, [track]: { ...prev[track], [field]: value } }));

  // Her iz için ayrı PATCH — backend tek istekte tek iz günceller
  const submit = async (build: (track: ShootTrack) => Record<string, unknown>) => {
    setError('');
    setIsSubmitting(true);
    try {
      for (const [index, track] of tracks.entries()) {
        await api.patch(`/api/shooting-list/${entry.id}`, {
          track,
          clientId,
          // expectedTime izden bağımsız; sadece ilk istekte gönderilir
          ...(canEditExpected && index === 0
            ? { expectedTime: expectedTime.trim() || null }
            : {}),
          ...build(track),
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = () =>
    submit((track) => ({
      startedAt: toIso(times[track]?.startedAt ?? ''),
      endedAt: toIso(times[track]?.endedAt ?? ''),
    }));

  const handleReset = () => submit(() => ({ action: 'reset' }));

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
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

          {canEditExpected && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Beklenen Çıkış (Excel&apos;den)
              </label>
              <input
                type="text"
                value={expectedTime}
                onChange={(e) => setExpectedTime(e.target.value)}
                placeholder="Örn: 14:23"
                className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {tracks.map((track) => (
            <div key={track} className="space-y-3 rounded-lg border border-gray-700 p-3">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
                {TRACK_LABELS[track]}
              </p>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Başlangıç</label>
                <input
                  type="datetime-local"
                  step="1"
                  value={times[track]?.startedAt ?? ''}
                  onChange={(e) => setField(track, 'startedAt', e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Bitiş</label>
                <input
                  type="datetime-local"
                  step="1"
                  value={times[track]?.endedAt ?? ''}
                  onChange={(e) => setField(track, 'endedAt', e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          ))}
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
