import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Loader2, Star } from 'lucide-react';
import api from '../../lib/api';
import { POINT_TYPE_LABELS as TYPE_LABELS, type LoyaltySummary } from '../../lib/loyalty';

// Admin → müşteri detayı: puan, seviye, geçmiş ve elle düzeltme
const UserLoyaltyPanel = ({ userId }: { userId: string }) => {
  const [summary, setSummary] = useState<LoyaltySummary | null>(null);
  const [amount, setAmount] = useState('');
  // add: +50 / -20 ekle-çıkar · set: puanı doğrudan bu değere ayarla
  const [mode, setMode] = useState<'add' | 'set'>('add');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/api/loyalty/users/${userId}`)
      .then(({ data }) => {
        if (!cancelled) setSummary(data);
      })
      .catch((error) => console.error('Puan bilgisi yüklenemedi:', error));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const value = parseInt(amount);
      const { data } = await api.post(`/api/loyalty/users/${userId}/adjust`, {
        ...(mode === 'set' ? { setTo: value } : { amount: value }),
        note,
      });
      setSummary(data);
      setAmount('');
      setNote('');
      toast.success('Puan güncellendi');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj.response?.data?.message || 'Puan güncellenemedi');
    } finally {
      setIsSaving(false);
    }
  };

  if (!summary) return null;

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" />
          Sadakat
        </h2>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-white font-semibold">{summary.balance.toLocaleString('tr-TR')} puan</span>
          {summary.tier ? (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold">
              {summary.tier.name} · %{summary.tier.discountPercent}
            </span>
          ) : (
            <span className="text-gray-500 text-xs">Seviye yok</span>
          )}
          {summary.nextTier && (
            <span className="text-gray-500 text-xs">
              {summary.nextTier.name}'e {summary.pointsToNext} puan
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleAdjust} className="flex flex-wrap gap-2 mb-4">
        <div className="flex rounded-lg border border-gray-600 overflow-hidden text-xs">
          {(
            [
              ['add', 'Ekle / Çıkar'],
              ['set', 'Değere ayarla'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`px-3 py-1.5 transition-colors ${
                mode === value ? 'bg-amber-500/20 text-amber-300' : 'bg-gray-900/50 text-gray-400 hover:text-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={mode === 'set' ? `ör. 500` : '+50 / -20'}
          min={mode === 'set' ? 0 : undefined}
          required
          className="w-28 px-3 py-1.5 bg-gray-900/50 border border-gray-600 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-amber-500"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Açıklama (zorunlu)"
          required
          maxLength={200}
          className="flex-1 min-w-48 px-3 py-1.5 bg-gray-900/50 border border-gray-600 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-sm font-medium disabled:opacity-50"
        >
          {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {mode === 'set' ? 'Puanı Ayarla' : 'Puanı Düzelt'}
        </button>
      </form>

      {summary.transactions.length === 0 ? (
        <p className="text-sm text-gray-500">Henüz puan hareketi yok.</p>
      ) : (
        <ul className="divide-y divide-gray-700/60 max-h-64 overflow-y-auto">
          {summary.transactions.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="text-gray-300 truncate">{t.note || TYPE_LABELS[t.type]}</p>
                <p className="text-xs text-gray-500">
                  {TYPE_LABELS[t.type]} · {new Date(t.createdAt).toLocaleString('tr-TR')}
                </p>
              </div>
              <span className={`font-semibold ${t.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {t.amount > 0 ? '+' : ''}
                {t.amount}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserLoyaltyPanel;
