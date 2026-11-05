import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, X, Award, Save, MapPin, Calendar, Images, ExternalLink } from 'lucide-react';
import api from '../../lib/api';
import TranslationFields, { type Translations } from '../../components/admin/TranslationFields';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import { Button, EmptyState, IconButton, PageHeader, Panel, SkeletonRows } from '../../components/admin/ui';

import { AWARD_FALLBACK_IMAGE, type AwardCeremonySummary } from '../../lib/awardCeremonies';

interface CeremonyFormData {
  title: string;
  description: string;
  date: string;
  location: string;
  sortOrder: number;
  translations: Translations;
}

const initialFormData: CeremonyFormData = {
  title: '',
  description: '',
  date: '',
  location: '',
  sortOrder: 0,
  translations: {},
};

const inputClass =
  'w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500';

const AwardCeremoniesPage = () => {
  const [ceremonies, setCeremonies] = useState<AwardCeremonySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CeremonyFormData>(initialFormData);
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState<AwardCeremonySummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCeremonies = async () => {
    try {
      const { data } = await api.get('/api/award-ceremonies');
      setCeremonies(data);
    } catch (error) {
      console.error('Ödül törenleri yüklenemedi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCeremonies();
  }, []);

  const openCreateModal = () => {
    setFormData({ ...initialFormData, sortOrder: (ceremonies.length + 1) * 10 });
    setEditingId(null);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (ceremony: AwardCeremonySummary) => {
    setFormData({
      title: ceremony.title,
      description: ceremony.description || '',
      date: ceremony.date || '',
      location: ceremony.location || '',
      sortOrder: ceremony.sortOrder,
      translations: ceremony.translations ?? {},
    });
    setEditingId(ceremony.id);
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(initialFormData);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (editingId) {
        await api.put(`/api/award-ceremonies/${editingId}`, formData);
      } else {
        await api.post('/api/award-ceremonies', formData);
      }
      await fetchCeremonies();
      closeModal();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(errorObj.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/award-ceremonies/${toDelete.id}`);
      setCeremonies((prev) => prev.filter((c) => c.id !== toDelete.id));
      setToDelete(null);
      toast.success('Ödül töreni silindi');
    } catch (error) {
      console.error('Ödül töreni silinemedi:', error);
      toast.error('Ödül töreni silinemedi');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ödül Törenleri"
        icon={Award}
        description={
          <>
            Herkese açık ödül töreni galerileri (
            <a href="/odul-torenleri" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">
              /odul-torenleri
            </a>
            )
          </>
        }
        actions={
          <Button variant="primary" icon={Plus} onClick={openCreateModal}>
            Yeni Tören
          </Button>
        }
      />

      {/* Liste */}
      {isLoading ? (
        <Panel className="overflow-hidden">
          <SkeletonRows rows={4} />
        </Panel>
      ) : ceremonies.length === 0 ? (
        <EmptyState icon={Award} title="Henüz ödül töreni eklenmedi" />
      ) : (
        <div className="space-y-3">
          {ceremonies.map((ceremony) => (
            <Panel key={ceremony.id} className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <img
                  src={ceremony.coverUrl || AWARD_FALLBACK_IMAGE}
                  alt=""
                  className={`w-16 h-12 rounded-lg object-cover shrink-0 ${ceremony.coverUrl ? '' : 'opacity-40'}`}
                />
                <div className="min-w-0">
                  <h3 className="text-white font-semibold truncate">{ceremony.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 mt-1">
                    <span className="flex items-center gap-1.5">
                      <Images className="w-3.5 h-3.5 text-amber-500/70" />
                      {ceremony.photoCount} dosya
                    </span>
                    {ceremony.date && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-500/70" />
                        {ceremony.date}
                      </span>
                    )}
                    {ceremony.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-500/70" />
                        {ceremony.location}
                      </span>
                    )}
                    <span className="text-gray-600">Sıra: {ceremony.sortOrder}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="soft" icon={Images} to={`/admin/award-ceremonies/${ceremony.id}`}>
                  Fotoğraflar
                </Button>
                <a
                  href={`/odul-torenleri/${ceremony.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-amber-400 transition-colors"
                  title="Sitede gör"
                  aria-label="Sitede gör"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <IconButton icon={Pencil} title="Düzenle" onClick={() => openEditModal(ceremony)} />
                <IconButton icon={Trash2} title="Sil" tone="danger" onClick={() => setToDelete(ceremony)} />
              </div>
            </Panel>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 sticky top-0 bg-gray-800">
              <h2 className="text-lg font-semibold text-white">
                {editingId ? 'Töreni Düzenle' : 'Yeni Ödül Töreni'}
              </h2>
              <button onClick={closeModal} className="p-1 text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-1">Tören Adı *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  required
                  maxLength={150}
                  placeholder="Baby Games Ödül Töreni — 1. Gün"
                  className={inputClass}
                />
                {!editingId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Sayfa adresi bu addan oluşturulur ve sonradan değişmez.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Açıklama</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  maxLength={2000}
                  placeholder="Kısa bir açıklama (opsiyonel)"
                  className={inputClass}
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tarih</label>
                  <input
                    type="text"
                    value={formData.date}
                    onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                    maxLength={100}
                    placeholder="12 Ekim 2026"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Konum</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                    maxLength={150}
                    placeholder="İstanbul"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Sıra</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData((p) => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* EN/RU çevirileri — boş alan sitede Türkçe görünür */}
              <TranslationFields
                fields={[
                  { key: 'title', label: 'Tören Adı', source: formData.title },
                  { key: 'description', label: 'Açıklama', multiline: true, source: formData.description },
                  { key: 'date', label: 'Tarih', source: formData.date },
                  { key: 'location', label: 'Konum', source: formData.location },
                ]}
                value={formData.translations}
                onChange={(translations) => setFormData((p) => ({ ...p, translations }))}
              />

              <div className="flex gap-3 pt-2">
                <Button className="flex-1" onClick={closeModal}>
                  İptal
                </Button>
                <Button type="submit" variant="primary" className="flex-1" icon={Save} loading={isSubmitting}>
                  {editingId ? 'Güncelle' : 'Oluştur'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={!!toDelete}
        title="Ödül töreni silinsin mi?"
        message={
          toDelete && (
            <>
              <strong className="text-white">{toDelete.title}</strong> töreni
              {toDelete.photoCount > 0 && (
                <>
                  {' '}
                  ve <strong className="text-red-400">{toDelete.photoCount} dosyası</strong>
                </>
              )}{' '}
              kalıcı olarak silinecek; sitedeki adresi de çalışmaz olur. Bu işlem geri alınamaz.
            </>
          )
        }
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
};

export default AwardCeremoniesPage;
