import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Loader2, Pencil, Plus, Save, Star, Trash2, X } from 'lucide-react';
import api from '../../lib/api';
import type { LoyaltyTier } from '../../lib/loyalty';

interface TierForm {
  name: string;
  minPoints: number;
  discountPercent: number;
}

const emptyForm: TierForm = { name: '', minPoints: 100, discountPercent: 5 };

const inputClass =
  'w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500';

// Sadakat seviyeleri: toplam puan eşiğe ulaşınca yüzde indirim
const LoyaltyPage = () => {
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<TierForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchTiers = async () => {
    try {
      const { data } = await api.get('/api/loyalty/tiers');
      setTiers(data);
    } catch (error) {
      console.error('Seviyeler yüklenemedi:', error);
      toast.error('Seviyeler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTiers();
  }, []);

  const startEdit = (tier: LoyaltyTier | null) => {
    setEditingId(tier ? tier.id : 'new');
    setForm(tier ? { name: tier.name, minPoints: tier.minPoints, discountPercent: tier.discountPercent } : emptyForm);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId === 'new') {
        await api.post('/api/loyalty/tiers', form);
      } else {
        await api.put(`/api/loyalty/tiers/${editingId}`, form);
      }
      toast.success('Seviye kaydedildi');
      setEditingId(null);
      await fetchTiers();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj.response?.data?.message || 'Kaydedilemedi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/loyalty/tiers/${id}`);
      setTiers((prev) => prev.filter((t) => t.id !== id));
      setDeleteConfirm(null);
      toast.success('Seviye silindi');
    } catch {
      toast.error('Seviye silinemedi');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Star className="w-7 h-7 text-amber-500" />
            Sadakat Sistemi
          </h1>
          <p className="text-gray-400 mt-1">Puan seviyeleri ve indirim oranları</p>
        </div>
        <button
          onClick={() => startEdit(null)}
          className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Yeni Seviye
        </button>
      </div>

      {/* Nasıl çalışır */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5 mb-6 text-sm text-gray-300 space-y-1.5">
        <p>• Paket puanları <strong className="text-white">Paketler</strong> sayfasından verilir (seri başına).</p>
        <p>• Puan <strong className="text-white">ödeme alınınca</strong> yazılır: rezervasyon Ödendi/Teslim Edildi olunca veya online ödeme başarılı olunca.</p>
        <p>• Ödenmiş kayıt <strong className="text-white">İptal</strong> edilirse puan geri alınır. Kaydı <strong className="text-white">silmek puanı geri almaz</strong>.</p>
        <p>• Bakiyesi bir seviyeye ulaşan müşteriye indirim <strong className="text-white">otomatik</strong> uygulanır ve seviyenin puanı <strong className="text-white">harcanır</strong> (ör. Altın kullanılınca −500); fazlası kalır.</p>
        <p>• Rezervasyonda puan oluşturunca düşer; ödenmeden silinir/iptal edilirse <strong className="text-white">iade edilir</strong>. Online siparişte puan ödeme başarılı olunca düşer.</p>
        <p>• İndirim giriş yapmış müşteriye ve admin panelden eklenen rezervasyona uygulanır (misafire uygulanmaz); oluşturma anındaki yüzde kayda sabitlenir.</p>
        <p>• Bir müşterinin puanını elle düzeltmek için: Kullanıcılar → müşteri detayı.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {tiers.length === 0 && editingId !== 'new' && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-10 text-center text-gray-400">
              Henüz seviye yok — indirim uygulanmaz.
            </div>
          )}

          {[...tiers, ...(editingId === 'new' ? [null] : [])].map((tier) => {
            const id = tier?.id ?? 'new';
            if (editingId === id) {
              return (
                <form
                  key={id}
                  onSubmit={handleSave}
                  className="bg-gray-800/70 border border-amber-500/40 rounded-2xl p-4 grid sm:grid-cols-[1fr_140px_140px_auto] gap-3 items-end"
                >
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Seviye adı</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      required
                      maxLength={50}
                      placeholder="Platin"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Gereken puan</label>
                    <input
                      type="number"
                      min={1}
                      value={form.minPoints}
                      onChange={(e) => setForm((f) => ({ ...f, minPoints: parseInt(e.target.value) || 0 }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">İndirim %</label>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={form.discountPercent}
                      onChange={(e) => setForm((f) => ({ ...f, discountPercent: parseInt(e.target.value) || 0 }))}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Kaydet
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300"
                      title="Vazgeç"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              );
            }
            if (!tier) return null;
            return (
              <div
                key={tier.id}
                className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-semibold">
                    {tier.name}
                  </span>
                  <span className="text-gray-300">{tier.minPoints.toLocaleString('tr-TR')}+ puan</span>
                  <span className="text-emerald-400 font-semibold">%{tier.discountPercent} indirim</span>
                </div>
                <div className="flex items-center gap-2">
                  {deleteConfirm === tier.id ? (
                    <>
                      <span className="text-sm text-red-400 mr-1">Emin misiniz?</span>
                      <button
                        onClick={() => handleDelete(tier.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium"
                      >
                        Sil
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300 text-sm"
                      >
                        Vazgeç
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(tier)}
                        className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-amber-400"
                        title="Düzenle"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(tier.id)}
                        className="p-2 rounded-lg bg-gray-700/50 hover:bg-red-500/20 text-gray-300 hover:text-red-400"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LoyaltyPage;
