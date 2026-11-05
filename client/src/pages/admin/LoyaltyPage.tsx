import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Pencil, Plus, Save, Star, Trash2, X } from 'lucide-react';
import api from '../../lib/api';
import type { LoyaltyTier } from '../../lib/loyalty';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import { Button, EmptyState, IconButton, PageHeader, Panel, SkeletonRows } from '../../components/admin/ui';

interface TierForm {
  name: string;
  minPoints: number;
  discountPercent: number;
  // Seviye adının çevirileri; boşsa sitede Türkçe ad görünür
  nameEn: string;
  nameRu: string;
}

const emptyForm: TierForm = { name: '', minPoints: 100, discountPercent: 5, nameEn: '', nameRu: '' };

const inputClass =
  'w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500';

// Sadakat seviyeleri: toplam puan eşiğe ulaşınca yüzde indirim
const LoyaltyPage = () => {
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<TierForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [toDelete, setToDelete] = useState<LoyaltyTier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    setForm(
      tier
        ? {
            name: tier.name,
            minPoints: tier.minPoints,
            discountPercent: tier.discountPercent,
            nameEn: tier.translations?.en?.name ?? '',
            nameRu: tier.translations?.ru?.name ?? '',
          }
        : emptyForm,
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const { nameEn, nameRu, ...rest } = form;
    const payload = { ...rest, translations: { en: { name: nameEn }, ru: { name: nameRu } } };
    try {
      if (editingId === 'new') {
        await api.post('/api/loyalty/tiers', payload);
      } else {
        await api.put(`/api/loyalty/tiers/${editingId}`, payload);
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

  const handleDelete = async () => {
    if (!toDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/loyalty/tiers/${toDelete.id}`);
      setTiers((prev) => prev.filter((t) => t.id !== toDelete.id));
      setToDelete(null);
      toast.success('Seviye silindi');
    } catch {
      toast.error('Seviye silinemedi');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sadakat Sistemi"
        icon={Star}
        description="Puan seviyeleri ve indirim oranları"
        actions={
          <Button variant="primary" icon={Plus} onClick={() => startEdit(null)}>
            Yeni Seviye
          </Button>
        }
      />

      {/* Nasıl çalışır */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 sm:p-5 text-sm text-gray-300 space-y-1.5">
        <p>• Paket puanları <strong className="text-white">Paketler</strong> sayfasından verilir (seri başına).</p>
        <p>• Puan <strong className="text-white">ödeme alınınca</strong> yazılır: rezervasyon Ödendi/Teslim Edildi olunca veya online ödeme başarılı olunca.</p>
        <p>• Ödenmiş kayıt <strong className="text-white">İptal</strong> edilirse puan geri alınır. Kaydı <strong className="text-white">silmek puanı geri almaz</strong>.</p>
        <p>• Bakiyesi bir seviyeye ulaşan müşteriye indirim <strong className="text-white">otomatik</strong> uygulanır ve seviyenin puanı <strong className="text-white">harcanır</strong> (ör. Altın kullanılınca −500); fazlası kalır.</p>
        <p>• Rezervasyonda puan oluşturunca düşer; ödenmeden silinir/iptal edilirse <strong className="text-white">iade edilir</strong>. Online siparişte puan ödeme başarılı olunca düşer.</p>
        <p>• İndirim giriş yapmış müşteriye ve admin panelden eklenen rezervasyona uygulanır (misafire uygulanmaz); oluşturma anındaki yüzde kayda sabitlenir.</p>
        <p>• Bir müşterinin puanını elle düzeltmek için: Kullanıcılar → müşteri detayı.</p>
      </div>

      {isLoading ? (
        <Panel className="overflow-hidden">
          <SkeletonRows rows={4} />
        </Panel>
      ) : (
        <div className="space-y-3">
          {tiers.length === 0 && editingId !== 'new' && (
            <EmptyState icon={Star} title="Henüz seviye yok" description="Seviye eklenene kadar indirim uygulanmaz." />
          )}

          {[...tiers, ...(editingId === 'new' ? [null] : [])].map((tier) => {
            const id = tier?.id ?? 'new';
            if (editingId === id) {
              return (
                <form
                  key={id}
                  onSubmit={handleSave}
                  className="bg-gray-800/70 border border-amber-500/40 rounded-xl p-4 grid sm:grid-cols-[1fr_140px_140px_auto] gap-3 items-end"
                >
                  {/* EN/RU ad — boşsa sitede Türkçe ad görünür */}
                  <div className="sm:col-span-4 grid grid-cols-2 gap-3 order-last">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Seviye adı (İngilizce)</label>
                      <input
                        value={form.nameEn}
                        onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                        maxLength={50}
                        placeholder={form.name || 'Platinum'}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Seviye adı (Rusça)</label>
                      <input
                        value={form.nameRu}
                        onChange={(e) => setForm((f) => ({ ...f, nameRu: e.target.value }))}
                        maxLength={50}
                        placeholder={form.name || 'Платина'}
                        className={inputClass}
                      />
                    </div>
                  </div>
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
                    <Button type="submit" variant="primary" icon={Save} loading={isSaving}>
                      Kaydet
                    </Button>
                    <IconButton icon={X} title="Vazgeç" onClick={() => setEditingId(null)} />
                  </div>
                </form>
              );
            }
            if (!tier) return null;
            return (
              <Panel key={tier.id} className="p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-semibold">
                    {tier.name}
                  </span>
                  <span className="text-gray-300">{tier.minPoints.toLocaleString('tr-TR')}+ puan</span>
                  <span className="text-emerald-400 font-semibold">%{tier.discountPercent} indirim</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <IconButton icon={Pencil} title="Düzenle" onClick={() => startEdit(tier)} />
                  <IconButton icon={Trash2} title="Sil" tone="danger" onClick={() => setToDelete(tier)} />
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      <ConfirmDeleteModal
        open={!!toDelete}
        title="Seviye silinsin mi?"
        message={
          <>
            <strong className="text-white">{toDelete?.name}</strong> seviyesi (%{toDelete?.discountPercent} indirim)
            silinecek. Mevcut kayıtlardaki indirimler değişmez; yeni kayıtlarda bu seviye uygulanmaz.
          </>
        }
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
};

export default LoyaltyPage;
