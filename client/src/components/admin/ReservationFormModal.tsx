import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, X, Package as PackageIcon, Save } from 'lucide-react';
import api from '../../lib/api';
import { APPARATUSES } from '../../constants/apparatuses';

interface PackageOption {
  id: string;
  name: string;
  category: string;
  reservationPrice: number;
  reservationDiscounts: { 2: number; 3: number };
}

export interface ReservationItemInput {
  rowId: string;
  packageId: string;
  seriesCount: 1 | 2 | 3;
  quantity: number;
  apparatuses: string[];
}

export interface ReservationFormPayload {
  athleteName: string;
  clubName: string;
  birthYear: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
  status?: string;
  items: {
    packageId: string;
    seriesCount: number;
    quantity: number;
    apparatuses: string[];
  }[];
}

interface ExistingReservation {
  id: string;
  athleteName: string;
  clubName: string;
  birthYear: string;
  customerPhone: string;
  customerEmail: string;
  notes: string | null;
  status: string;
  items: {
    packageId: string;
    seriesCount: number;
    quantity: number;
    apparatuses?: string[];
  }[];
}

interface Props {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: ExistingReservation | null;
  onClose: () => void;
  onSaved: () => void;
}

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Bekliyor' },
  { value: 'CONFIRMED', label: 'Onaylandı' },
  { value: 'PAID', label: 'Ödendi' },
  { value: 'CANCELLED', label: 'İptal' },
];

const emptyForm = {
  athleteName: '',
  clubName: '',
  birthYear: '',
  customerPhone: '',
  customerEmail: '',
  notes: '',
  status: 'PENDING',
};

const ReservationFormModal = ({ isOpen, mode, initialData, onClose, onSaved }: Props) => {
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState<ReservationItemInput[]>([]);

  const toggleApparatusOnRow = (rowId: string, slug: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.rowId !== rowId) return it;
        const exists = it.apparatuses.includes(slug);
        if (exists) {
          return {
            ...it,
            apparatuses: it.apparatuses.filter((s) => s !== slug),
          };
        }
        if (it.apparatuses.length >= it.seriesCount) return it;
        return { ...it, apparatuses: [...it.apparatuses, slug] };
      }),
    );
  };

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setIsLoadingPackages(true);
    api
      .get('/api/packages')
      .then(({ data }) => setPackages(data))
      .catch((err) => console.error('Paketler alınamadı:', err))
      .finally(() => setIsLoadingPackages(false));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && initialData) {
      setForm({
        athleteName: initialData.athleteName,
        clubName: initialData.clubName,
        birthYear: initialData.birthYear,
        customerPhone: initialData.customerPhone,
        customerEmail: initialData.customerEmail,
        notes: initialData.notes ?? '',
        status: initialData.status,
      });
      setItems(
        initialData.items.map((it, idx) => ({
          rowId: `existing-${idx}-${Date.now()}`,
          packageId: it.packageId,
          seriesCount: (it.seriesCount as 1 | 2 | 3) ?? 1,
          quantity: it.quantity,
          apparatuses: it.apparatuses ?? [],
        })),
      );
    } else {
      setForm(emptyForm);
      setItems([]);
    }
  }, [isOpen, mode, initialData]);

  if (!isOpen) return null;

  const getItemPrice = (packageId: string, seriesCount: 1 | 2 | 3) => {
    const pkg = packages.find((p) => p.id === packageId);
    if (!pkg) return 0;
    if (seriesCount === 1) return pkg.reservationPrice;
    return pkg.reservationDiscounts[seriesCount];
  };

  const totalPrice = items.reduce(
    (sum, it) => sum + getItemPrice(it.packageId, it.seriesCount) * it.quantity,
    0,
  );

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(price);

  const addRow = () => {
    setItems((prev) => [
      ...prev,
      {
        rowId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        packageId: '',
        seriesCount: 1,
        quantity: 1,
        apparatuses: [],
      },
    ]);
  };

  const removeRow = (rowId: string) => {
    setItems((prev) => prev.filter((it) => it.rowId !== rowId));
  };

  const updateRow = (rowId: string, patch: Partial<ReservationItemInput>) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.rowId !== rowId) return it;
        const next = { ...it, ...patch };
        // seriesCount değişirse fazla seçili aletleri kırp
        if (patch.seriesCount !== undefined && patch.seriesCount !== it.seriesCount) {
          next.apparatuses = it.apparatuses.slice(0, patch.seriesCount);
        }
        return next;
      }),
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (
      !form.athleteName.trim() ||
      !form.clubName.trim() ||
      !form.birthYear.trim() ||
      !form.customerPhone.trim() ||
      !form.customerEmail.trim()
    ) {
      setError('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    if (items.length === 0) {
      setError('Lütfen en az bir paket ekleyin');
      return;
    }

    if (items.some((it) => !it.packageId)) {
      setError('Lütfen tüm satırlarda paket seçin');
      return;
    }

    if (items.some((it) => it.apparatuses.length !== it.seriesCount)) {
      setError('Her paket için seri sayısı kadar alet seçin');
      return;
    }

    const payload: ReservationFormPayload = {
      athleteName: form.athleteName.trim(),
      clubName: form.clubName.trim(),
      birthYear: form.birthYear.trim(),
      customerPhone: form.customerPhone.trim(),
      customerEmail: form.customerEmail.trim(),
      notes: form.notes.trim(),
      items: items.map((it) => ({
        packageId: it.packageId,
        seriesCount: it.seriesCount,
        quantity: it.quantity,
        apparatuses: it.apparatuses,
      })),
    };

    if (mode === 'edit') {
      payload.status = form.status;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'edit' && initialData) {
        await api.put(`/api/reservations/${initialData.id}`, payload);
      } else {
        await api.post('/api/reservations', payload);
      }
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800 z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-white">
            {mode === 'edit' ? 'Rezervasyonu Düzenle' : 'Yeni Rezervasyon'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Sporcu Bilgileri */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">Sporcu Bilgileri</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Sporcu Adı Soyadı <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="athleteName"
                  value={form.athleteName}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Kulüp / Şube <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="clubName"
                  value={form.clubName}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Doğum Yılı <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="birthYear"
                  value={form.birthYear}
                  onChange={handleChange}
                  placeholder="2015"
                  className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Telefon <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={form.customerPhone}
                  onChange={handleChange}
                  placeholder="0532 123 45 67"
                  className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">
                  E-posta <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  name="customerEmail"
                  value={form.customerEmail}
                  onChange={handleChange}
                  placeholder="ornek@gmail.com"
                  className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              {mode === 'edit' && (
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">Durum</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Notlar</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Ek not"
                  className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Paketler */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-300">Paketler</h3>
              <button
                type="button"
                onClick={addRow}
                disabled={isLoadingPackages}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/40 text-violet-300 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                Paket Ekle
              </button>
            </div>

            {isLoadingPackages ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-6 text-gray-500 bg-gray-900/30 border border-dashed border-gray-700 rounded-lg">
                <PackageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Henüz paket eklenmedi.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((it) => {
                  const pkg = packages.find((p) => p.id === it.packageId);
                  const lineTotal = getItemPrice(it.packageId, it.seriesCount) * it.quantity;
                  return (
                    <div
                      key={it.rowId}
                      className="grid md:grid-cols-12 gap-2 p-3 bg-gray-900/50 border border-gray-700 rounded-lg"
                    >
                      <div className="md:col-span-5">
                        <label className="text-[11px] text-gray-500 mb-1 block">Paket</label>
                        <select
                          value={it.packageId}
                          onChange={(e) => updateRow(it.rowId, { packageId: e.target.value })}
                          className="w-full px-2.5 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:border-violet-500"
                        >
                          <option value="">Paket seçin</option>
                          {packages.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} — {formatPrice(p.reservationPrice)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-3">
                        <label className="text-[11px] text-gray-500 mb-1 block">Seri</label>
                        <select
                          value={it.seriesCount}
                          onChange={(e) =>
                            updateRow(it.rowId, {
                              seriesCount: Number(e.target.value) as 1 | 2 | 3,
                            })
                          }
                          disabled={!it.packageId}
                          className="w-full px-2.5 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:border-violet-500 disabled:opacity-50"
                        >
                          <option value={1}>
                            1 Seri{pkg ? ` — ${formatPrice(pkg.reservationPrice)}` : ''}
                          </option>
                          <option value={2}>
                            2 Seri{pkg ? ` — ${formatPrice(pkg.reservationDiscounts[2])}` : ''}
                          </option>
                          <option value={3}>
                            3 Seri{pkg ? ` — ${formatPrice(pkg.reservationDiscounts[3])}` : ''}
                          </option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[11px] text-gray-500 mb-1 block">Adet</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={it.quantity}
                          onChange={(e) =>
                            updateRow(it.rowId, {
                              quantity: Math.max(1, Math.min(100, Number(e.target.value) || 1)),
                            })
                          }
                          disabled={!it.packageId}
                          className="w-full px-2.5 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:border-violet-500 disabled:opacity-50"
                        />
                      </div>

                      <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-2 md:flex-col md:items-end md:gap-1">
                        <div className="md:self-end">
                          <label className="text-[11px] text-gray-500 block md:text-right">Tutar</label>
                          <span className="text-sm font-semibold text-violet-300 block md:text-right">
                            {formatPrice(lineTotal)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRow(it.rowId)}
                          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                          aria-label="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Alet seçimi */}
                      <div className="md:col-span-12 mt-1">
                        <label className="text-[11px] text-gray-500 mb-1.5 block">
                          Aletler <span className="text-red-400">*</span>
                          <span className="text-gray-600 ml-1">
                            ({it.apparatuses.length} / {it.seriesCount} seçildi)
                          </span>
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {APPARATUSES.map((a) => {
                            const active = it.apparatuses.includes(a.slug);
                            const slotsFull =
                              !active && it.apparatuses.length >= it.seriesCount;
                            return (
                              <button
                                key={a.slug}
                                type="button"
                                disabled={!it.packageId || slotsFull}
                                onClick={() => toggleApparatusOnRow(it.rowId, a.slug)}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                  active
                                    ? 'bg-violet-500/20 border-violet-500 text-violet-300'
                                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
                                }`}
                              >
                                {a.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Toplam ve Aksiyonlar */}
          <div className="pt-4 border-t border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs text-gray-400">Toplam Tutar</p>
              <p className="text-2xl font-bold text-violet-400">{formatPrice(totalPrice)}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {mode === 'edit' ? 'Güncelle' : 'Oluştur'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReservationFormModal;
