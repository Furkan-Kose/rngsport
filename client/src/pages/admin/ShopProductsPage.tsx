import { useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Eye, EyeOff, ImagePlus, Loader2, Pencil, Plus, Save, ShoppingBag, Trash2, X } from 'lucide-react';
import api from '../../lib/api';
import { formatTL } from '../../lib/loyalty';
import TranslationFields, { type Translations } from '../../components/admin/TranslationFields';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import { APPARATUSES, getApparatusLabel } from '../../constants/apparatuses';

interface FieldDef {
  key: string;
  label: string;
  required: boolean;
  maxLength: number;
}

// Alet → poz seçimi (her alette 3 poz yeri). image = R2 key, imageUrl = önizleme
interface PoseSlot {
  no: number;
  image: string | null;
  imageUrl?: string | null;
  label: string | null;
}
interface PoseApparatus {
  slug: string;
  enabled: boolean;
  poses: PoseSlot[];
}
interface PoseOptions {
  enabled: boolean;
  apparatuses: PoseApparatus[];
}

const emptyPoseOptions = (enabled = false): PoseOptions => ({
  enabled,
  apparatuses: APPARATUSES.map((a) => ({
    slug: a.slug,
    enabled: true,
    poses: [1, 2, 3].map((no) => ({ no, image: null, imageUrl: null, label: null })),
  })),
});

const poseStats = (opts: PoseOptions) => {
  const slots = opts.apparatuses.filter((a) => a.enabled).flatMap((a) => a.poses);
  return { filled: slots.filter((p) => p.image).length, total: slots.length };
};

interface AdminShopProduct {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  summary: string | null;
  description: string | null;
  price: number | null;
  image: string | null;
  imageUrl: string | null;
  customFields: FieldDef[];
  poseOptions: PoseOptions;
  translations: Record<string, Record<string, unknown>>;
  isActive: boolean;
  sortOrder: number;
  orderCount: number;
}

interface FormState {
  name: string;
  slug: string;
  tagline: string;
  summary: string;
  description: string;
  price: string;
  image: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  customFields: FieldDef[];
  poseOptions: PoseOptions;
  translations: Translations;
}

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  tagline: '',
  summary: '',
  description: '',
  price: '',
  image: '',
  imageUrl: '',
  isActive: false,
  sortOrder: 0,
  customFields: [],
  poseOptions: emptyPoseOptions(false),
  translations: {},
};

// Sunucudaki slugify ile aynı sonuç (alan anahtarı çevirilerde kullanıldığı için istemcide de üretilir)
const TR_MAP: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', i: 'i', ö: 'o', ş: 's', ü: 'u' };
const toFieldKey = (label: string) =>
  label
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşü]/g, (c) => TR_MAP[c] ?? c)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30);

const inputClass =
  'w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-amber-500';
const labelClass = 'block text-sm font-medium text-gray-300 mb-1';

// Sunucu formatı { en: { name, ..., fields: { key: label } } } ↔ form formatı { en: { name, "field:key": label } }
const toFormTranslations = (input: AdminShopProduct['translations']): Translations => {
  const out: Translations = {};
  for (const lang of ['en', 'ru'] as const) {
    const src = input?.[lang];
    if (!src) continue;
    const entry: Record<string, string> = {};
    for (const [k, v] of Object.entries(src)) {
      if (k === 'fields' && v && typeof v === 'object') {
        for (const [fk, fv] of Object.entries(v as Record<string, string>)) entry[`field:${fk}`] = fv;
      } else if (typeof v === 'string') entry[k] = v;
    }
    out[lang] = entry;
  }
  return out;
};

const toServerTranslations = (input: Translations) => {
  const out: Record<string, Record<string, unknown>> = {};
  for (const lang of ['en', 'ru'] as const) {
    const src = input[lang];
    if (!src) continue;
    const entry: Record<string, unknown> = {};
    const fields: Record<string, string> = {};
    for (const [k, v] of Object.entries(src)) {
      if (typeof v !== 'string') continue;
      if (k.startsWith('field:')) fields[k.slice(6)] = v;
      else entry[k] = v;
    }
    out[lang] = { ...entry, fields };
  }
  return out;
};

const ShopProductsPage = () => {
  const [products, setProducts] = useState<AdminShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminShopProduct | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toDelete, setToDelete] = useState<AdminShopProduct | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get<AdminShopProduct[]>('/api/shop/admin/products');
      setProducts(data);
    } catch (err) {
      console.error('Ürünler yüklenemedi:', err);
      toast.error('Ürünler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, sortOrder: products.length + 1 });
    setFormOpen(true);
  };

  const openEdit = (p: AdminShopProduct) => {
    setEditing(p);
    setForm({
      name: p.name,
      slug: p.slug,
      tagline: p.tagline ?? '',
      summary: p.summary ?? '',
      description: p.description ?? '',
      price: p.price != null ? String(p.price) : '',
      image: p.image ?? '',
      imageUrl: p.imageUrl ?? '',
      isActive: p.isActive,
      sortOrder: p.sortOrder,
      customFields: p.customFields,
      poseOptions: p.poseOptions ?? emptyPoseOptions(false),
      translations: toFormTranslations(p.translations),
    });
    setFormOpen(true);
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const setField = (index: number, patch: Partial<FieldDef>) =>
    setForm((f) => ({
      ...f,
      customFields: f.customFields.map((field, i) => {
        if (i !== index) return field;
        const next = { ...field, ...patch };
        // Yeni alanın anahtarı etiketten; kaydedilmiş alanın anahtarı sabit kalır (siparişler ona bağlı)
        if (patch.label !== undefined && !editing?.customFields.some((c) => c.key === field.key)) {
          next.key = toFieldKey(patch.label) || field.key;
        }
        return next;
      }),
    }));

  // R2'ye yükler, key + yerel önizleme döner (ürün görseli ve poz görselleri ortak)
  const uploadImage = async (file: File) => {
    const { data } = await api.post('/api/shop/admin/products/upload-image', { contentType: file.type, size: file.size });
    // Plain axios: api singleton'ı withCredentials gönderir, R2'ye cookie gitmemeli
    await axios.put(data.uploadUrl, file, { headers: { 'Content-Type': file.type } });
    return { key: data.key as string, previewUrl: URL.createObjectURL(file) };
  };

  const withUpload = async (file: File | undefined, apply: (r: { key: string; previewUrl: string }) => void) => {
    if (!file) return;
    setUploading(true);
    try {
      apply(await uploadImage(file));
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(message || 'Görsel yüklenemedi');
    } finally {
      setUploading(false);
    }
  };

  const handleImage = (file: File | undefined) =>
    withUpload(file, ({ key, previewUrl }) => setForm((f) => ({ ...f, image: key, imageUrl: previewUrl })));

  const updatePose = (slug: string, no: number, patch: Partial<PoseSlot>) =>
    setForm((f) => ({
      ...f,
      poseOptions: {
        ...f.poseOptions,
        apparatuses: f.poseOptions.apparatuses.map((a) =>
          a.slug !== slug ? a : { ...a, poses: a.poses.map((p) => (p.no === no ? { ...p, ...patch } : p)) }
        ),
      },
    }));

  const toggleApparatus = (slug: string, enabled: boolean) =>
    setForm((f) => ({
      ...f,
      poseOptions: {
        ...f.poseOptions,
        apparatuses: f.poseOptions.apparatuses.map((a) => (a.slug === slug ? { ...a, enabled } : a)),
      },
    }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        name: form.name,
        ...(form.slug.trim() && { slug: form.slug }),
        tagline: form.tagline,
        summary: form.summary,
        description: form.description,
        price: form.price.trim() === '' ? null : Number(form.price.replace(',', '.')),
        image: form.image || null,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder) || 0,
        customFields: form.customFields.filter((f) => f.label.trim()),
        poseOptions: {
          enabled: form.poseOptions.enabled,
          apparatuses: form.poseOptions.apparatuses.map((a) => ({
            slug: a.slug,
            enabled: a.enabled,
            poses: a.poses.map(({ no, image, label }) => ({ no, image, label })),
          })),
        },
        translations: toServerTranslations(form.translations),
      };
      if (editing) {
        await api.put(`/api/shop/admin/products/${editing.id}`, body);
        toast.success('Ürün güncellendi');
      } else {
        await api.post('/api/shop/admin/products', body);
        toast.success('Ürün eklendi');
      }
      setFormOpen(false);
      load();
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(message || 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p: AdminShopProduct) => {
    try {
      await api.put(`/api/shop/admin/products/${p.id}`, { isActive: !p.isActive });
      toast.success(p.isActive ? 'Satıştan kaldırıldı' : 'Satışa açıldı');
      load();
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(message || 'Güncellenemedi');
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const { data } = await api.delete(`/api/shop/admin/products/${toDelete.id}`);
      toast.success(data.message);
      setToDelete(null);
      load();
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(message || 'Silinemedi');
    } finally {
      setDeleting(false);
    }
  };

  const translationFields = [
    { key: 'name', label: 'Ürün adı', source: form.name },
    { key: 'tagline', label: 'Slogan', source: form.tagline },
    { key: 'summary', label: 'Kısa açıklama', source: form.summary, multiline: true },
    { key: 'description', label: 'Açıklama', source: form.description, multiline: true },
    ...form.customFields
      .filter((f) => f.label.trim() && f.key)
      .map((f) => ({ key: `field:${f.key}`, label: `Alan: ${f.label}`, source: f.label })),
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ShoppingBag className="w-7 h-7 text-amber-500" />
            Ürünler
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Kişiye özel ürünler. Fiyat girip <strong className="text-gray-200">aktif</strong> yapılan ürün sitede satışa açılır.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl"
        >
          <Plus className="w-4 h-4" />
          Yeni Ürün
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <p className="text-gray-400 bg-gray-800/50 border border-gray-700 rounded-2xl p-10 text-center">Henüz ürün yok</p>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id} className="bg-gray-800/50 border border-gray-700 rounded-2xl overflow-hidden flex flex-col">
              <div className="relative aspect-video bg-gray-900">
                {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />}
                <span
                  className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                    p.isActive ? 'bg-emerald-600 text-white border-emerald-400/60 shadow-lg' : 'bg-gray-900/80 text-gray-300 border-gray-600'
                  }`}
                >
                  {p.isActive ? 'Satışta' : 'Pasif (Çok yakında)'}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h2 className="font-semibold text-white">{p.name}</h2>
                <p className="text-xs text-gray-500 mt-0.5">/urunler/{p.slug}</p>
                <p className="text-lg font-bold text-amber-400 mt-2">{p.price != null ? formatTL(p.price) : 'Fiyat girilmedi'}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {p.customFields.length} kişiselleştirme alanı · {p.orderCount} sipariş · sıra {p.sortOrder}
                </p>
                {p.poseOptions?.enabled && (() => {
                  const { filled, total } = poseStats(p.poseOptions);
                  return (
                    <p className={`text-xs mt-1 ${filled === total ? 'text-emerald-400' : 'text-amber-400'}`}>
                      Poz fotoğrafları: {filled}/{total}
                    </p>
                  );
                })()}
                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-700">
                  <button onClick={() => openEdit(p)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm text-white">
                    <Pencil className="w-3.5 h-3.5" /> Düzenle
                  </button>
                  <button
                    onClick={() => toggleActive(p)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${
                      p.isActive ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {p.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {p.isActive ? 'Satıştan kaldır' : 'Satışa aç'}
                  </button>
                  <button onClick={() => setToDelete(p)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-sm text-red-400 ml-auto">
                    <Trash2 className="w-3.5 h-3.5" /> Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">{editing ? 'Ürünü Düzenle' : 'Yeni Ürün'}</h2>
              <button type="button" onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Ürün adı *</label>
                  <input value={form.name} onChange={(e) => set('name', e.target.value)} required maxLength={120} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Fiyat (₺, kargo dahil)</label>
                  <input value={form.price} onChange={(e) => set('price', e.target.value)} inputMode="decimal" placeholder="Örn. 1500" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Sitedeki adres (boşsa addan)</label>
                  <input value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="sporcu-figuru" className={inputClass} />
                  {editing && editing.slug !== form.slug && (
                    <p className="text-xs text-amber-400 mt-1">Adres değişirse paylaşılmış eski linkler çalışmaz.</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Slogan</label>
                  <input value={form.tagline} onChange={(e) => set('tagline', e.target.value)} maxLength={200} className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Kısa açıklama (kartlarda)</label>
                  <textarea value={form.summary} onChange={(e) => set('summary', e.target.value)} rows={2} maxLength={500} className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Açıklama (detay sayfası; paragrafları boş satırla ayırın)</label>
                  <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={5} className={inputClass} />
                  {['sporcu-figuru', 'isikli-cimnastik-harfi'].includes(form.slug) && (
                    <p className="text-xs text-gray-500 mt-1">Bu ürünün detay sayfasında sitedeki hazır tanıtım metni gösterilir.</p>
                  )}
                </div>
              </div>

              {/* Görsel */}
              <div>
                <label className={labelClass}>Görsel</label>
                <div className="flex items-center gap-4">
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt="" className="w-24 h-28 object-cover rounded-lg border border-gray-600" />
                  ) : (
                    <div className="w-24 h-28 rounded-lg border border-dashed border-gray-600 flex items-center justify-center text-gray-500 text-xs">Yok</div>
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm text-white cursor-pointer">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                    {uploading ? 'Yükleniyor...' : 'Görsel seç'}
                    <input
                      type="file"
                      accept=".webp,.jpg,.jpeg,.png,image/webp,image/jpeg,image/png"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => handleImage(e.target.files?.[0])}
                    />
                  </label>
                </div>
              </div>

              {/* Kişiselleştirme alanları */}
              <div className="p-4 bg-gray-900/40 border border-gray-700 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-medium text-white">Kişiselleştirme alanları</h3>
                    <p className="text-xs text-gray-500">Müşterinin sipariş verirken dolduracağı bilgiler (en fazla 10).</p>
                  </div>
                  <button
                    type="button"
                    disabled={form.customFields.length >= 10}
                    onClick={() => set('customFields', [...form.customFields, { key: `alan_${form.customFields.length + 1}`, label: '', required: false, maxLength: 100 }])}
                    className="flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300 disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" /> Alan ekle
                  </button>
                </div>
                <div className="space-y-2">
                  {form.customFields.map((field, i) => (
                    <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
                      <input value={field.label} onChange={(e) => setField(i, { label: e.target.value })} placeholder="Örn. Sporcu adı" maxLength={60} className={inputClass} />
                      <label className="flex items-center gap-1.5 text-xs text-gray-300 whitespace-nowrap">
                        <input type="checkbox" checked={field.required} onChange={(e) => setField(i, { required: e.target.checked })} className="accent-amber-500" />
                        Zorunlu
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={field.maxLength}
                        onChange={(e) => setField(i, { maxLength: Number(e.target.value) })}
                        title="En fazla karakter (100'den büyükse çok satırlı)"
                        className={`${inputClass} w-20`}
                      />
                      <button type="button" onClick={() => set('customFields', form.customFields.filter((_, j) => j !== i))} className="p-2 text-gray-400 hover:text-red-400" aria-label="Alanı sil">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {form.customFields.length === 0 && <p className="text-xs text-gray-500">Alan yok — müşteri sadece adres girer.</p>}
                </div>
              </div>

              {/* Alet → poz seçimi */}
              <div className="p-4 bg-gray-900/40 border border-gray-700 rounded-xl">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-sm font-medium text-white">Alet ve poz seçimi</h3>
                    <p className="text-xs text-gray-500">
                      Müşteri sipariş verirken önce aleti, sonra o aletin pozlarından birini seçer. Fotoğrafı olmayan poz ve hiç fotoğrafı olmayan alet müşteriye gösterilmez.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-200 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={form.poseOptions.enabled}
                      onChange={(e) => set('poseOptions', { ...form.poseOptions, enabled: e.target.checked })}
                      className="w-4 h-4 accent-amber-500"
                    />
                    Açık
                  </label>
                </div>

                {form.poseOptions.enabled && (
                  <>
                    {(() => {
                      const { filled, total } = poseStats(form.poseOptions);
                      return (
                        <p className={`text-xs mb-3 ${filled === total ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {total} pozdan {filled} tanesinin fotoğrafı yüklendi
                        </p>
                      );
                    })()}
                    <div className="space-y-3">
                      {form.poseOptions.apparatuses.map((a) => (
                        <div key={a.slug} className={`rounded-lg border p-3 ${a.enabled ? 'border-gray-600' : 'border-gray-700 opacity-60'}`}>
                          <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
                            <input type="checkbox" checked={a.enabled} onChange={(e) => toggleApparatus(a.slug, e.target.checked)} className="accent-amber-500" />
                            {getApparatusLabel(a.slug)}
                          </label>
                          {a.enabled && (
                            <div className="grid grid-cols-3 gap-2">
                              {a.poses.map((pose) => (
                                <div key={pose.no} className="space-y-1">
                                  <div className="relative aspect-3/4 rounded-lg overflow-hidden border border-dashed border-gray-600 bg-gray-800 flex items-center justify-center">
                                    {pose.imageUrl || pose.image ? (
                                      <>
                                        <img src={pose.imageUrl ?? ''} alt="" className="w-full h-full object-cover" />
                                        <button
                                          type="button"
                                          onClick={() => updatePose(a.slug, pose.no, { image: null, imageUrl: null })}
                                          className="absolute top-1 right-1 p-1 rounded bg-black/70 text-white hover:bg-red-600"
                                          aria-label="Fotoğrafı kaldır"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    ) : (
                                      <label className="flex flex-col items-center gap-1 text-xs text-gray-400 cursor-pointer hover:text-amber-400 p-2 text-center">
                                        <ImagePlus className="w-5 h-5" />
                                        Poz {pose.no}
                                        <input
                                          type="file"
                                          accept=".webp,.jpg,.jpeg,.png,image/webp,image/jpeg,image/png"
                                          className="hidden"
                                          disabled={uploading}
                                          onChange={(e) =>
                                            withUpload(e.target.files?.[0], ({ key, previewUrl }) =>
                                              updatePose(a.slug, pose.no, { image: key, imageUrl: previewUrl })
                                            )
                                          }
                                        />
                                      </label>
                                    )}
                                  </div>
                                  <input
                                    value={pose.label ?? ''}
                                    onChange={(e) => updatePose(a.slug, pose.no, { label: e.target.value || null })}
                                    placeholder={`Poz ${pose.no} adı (isteğe bağlı)`}
                                    maxLength={40}
                                    className={`${inputClass} text-xs px-2 py-1`}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <TranslationFields fields={translationFields} value={form.translations} onChange={(v) => set('translations', v)} />

              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-200">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="w-4 h-4 accent-emerald-500" />
                  Satışta (aktif)
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  Sıra
                  <input type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value))} className={`${inputClass} w-20`} />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700">
              <button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm">
                Vazgeç
              </button>
              <button type="submit" disabled={saving || uploading} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Kaydet
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDeleteModal
        open={!!toDelete}
        title="Ürün silinsin mi?"
        message={
          toDelete && (
            <>
              <strong>{toDelete.name}</strong>
              {toDelete.orderCount > 0
                ? ` ürününün ${toDelete.orderCount} siparişi var. Silinmez; satıştan kaldırılır ve siparişler korunur.`
                : ' kalıcı olarak silinecek. Bu işlem geri alınamaz.'}
            </>
          )
        }
        confirmLabel={toDelete && toDelete.orderCount > 0 ? 'Satıştan Kaldır' : 'Evet, Sil'}
        isDeleting={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
};

export default ShopProductsPage;
