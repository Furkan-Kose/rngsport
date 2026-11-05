import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Trophy, Save, MapPin, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../lib/api';
import TranslationFields, { type Translations } from '../../components/admin/TranslationFields';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import { Button, EmptyState, IconButton, PageHeader, Panel, SkeletonRows } from '../../components/admin/ui';


interface Tournament {
  id: string;
  name: string;
  date: string;
  location: string;
  flag: string | null;
  flagAlt: string | null;
  status: string;
  sortOrder: number;
  translations?: Translations;
}

interface TournamentFormData {
  name: string;
  date: string;
  location: string;
  flag: string; // '' = bayrak yok
  status: string;
  sortOrder: number;
  translations: Translations;
}

const initialFormData: TournamentFormData = {
  name: '',
  date: '',
  location: '',
  flag: '/flags/tr.svg',
  status: 'upcoming',
  sortOrder: 0,
  translations: {},
};

// Bayrak seçenekleri: value → flagAlt eşlemesi
const FLAG_OPTIONS = [
  { value: '/flags/tr.svg', label: 'Türkiye', alt: 'Türkiye' },
  { value: '/flags/kktc.svg', label: 'KKTC', alt: 'KKTC' },
  { value: '', label: 'Bayrak yok', alt: '' },
];

const STATUS_OPTIONS = [
  { value: 'upcoming', label: 'Yakında' },
  { value: 'ongoing', label: 'Aktif' },
  { value: 'finished', label: 'Tamamlandı' },
];

const getStatusBadge = (status: string) => {
  const badges: Record<string, string> = {
    ongoing: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    upcoming: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    finished: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  const labels: Record<string, string> = {
    ongoing: 'Aktif',
    upcoming: 'Yakında',
    finished: 'Tamamlandı',
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${badges[status] || badges.upcoming}`}>
      {labels[status] || status}
    </span>
  );
};

const TournamentsPage = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TournamentFormData>(initialFormData);
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState<Tournament | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const { data } = await api.get('/api/tournaments');
      setTournaments(data);
    } catch (error) {
      console.error('Turnuvalar yüklenemedi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({ ...initialFormData, sortOrder: (tournaments.length + 1) * 10 });
    setEditingId(null);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (tournament: Tournament) => {
    setFormData({
      name: tournament.name,
      date: tournament.date,
      location: tournament.location,
      flag: tournament.flag || '',
      status: tournament.status,
      sortOrder: tournament.sortOrder,
      translations: tournament.translations ?? {},
    });
    setEditingId(tournament.id);
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

    const flagOption = FLAG_OPTIONS.find((o) => o.value === formData.flag);
    const payload = {
      name: formData.name,
      date: formData.date,
      location: formData.location,
      flag: formData.flag || null,
      flagAlt: flagOption?.alt || null,
      status: formData.status,
      sortOrder: formData.sortOrder,
      translations: formData.translations,
    };

    try {
      if (editingId) {
        await api.put(`/api/tournaments/${editingId}`, payload);
      } else {
        await api.post('/api/tournaments', payload);
      }
      await fetchTournaments();
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
      await api.delete(`/api/tournaments/${toDelete.id}`);
      setTournaments((prev) => prev.filter((t) => t.id !== toDelete.id));
      setToDelete(null);
      toast.success('Turnuva silindi');
    } catch (error) {
      console.error('Turnuva silinemedi:', error);
      toast.error('Turnuva silinemedi');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Turnuvalar"
        icon={Trophy}
        description="Ana sayfadaki turnuva takvimini yönetin"
        actions={
          <Button variant="primary" icon={Plus} onClick={openCreateModal}>
            Yeni Turnuva
          </Button>
        }
      />

      {/* Liste */}
      {isLoading ? (
        <Panel className="overflow-hidden">
          <SkeletonRows rows={4} />
        </Panel>
      ) : tournaments.length === 0 ? (
        <EmptyState icon={Trophy} title="Henüz turnuva eklenmedi" description="Liste boşken ana sayfada turnuva bölümü gizlenir." />
      ) : (
        <div className="space-y-3">
          {tournaments.map((tournament) => (
            <Panel key={tournament.id} className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {tournament.flag && (
                  <img
                    src={tournament.flag}
                    alt={tournament.flagAlt || ''}
                    className="w-9 h-6 rounded-[3px] object-cover ring-1 ring-white/15 shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-white font-semibold truncate">{tournament.name}</h3>
                    {getStatusBadge(tournament.status)}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 mt-1">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-500/70" />
                      {tournament.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-500/70" />
                      {tournament.location}
                    </span>
                    <span className="text-gray-600">Sıra: {tournament.sortOrder}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <IconButton icon={Pencil} title="Düzenle" onClick={() => openEditModal(tournament)} />
                <IconButton icon={Trash2} title="Sil" tone="danger" onClick={() => setToDelete(tournament)} />
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
                {editingId ? 'Turnuvayı Düzenle' : 'Yeni Turnuva'}
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
                <label className="block text-sm text-gray-400 mb-1">Turnuva Adı *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  required
                  placeholder="International Ritmika Cup 2027"
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tarih *</label>
                  <input
                    type="text"
                    value={formData.date}
                    onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                    required
                    placeholder="18-21 Haziran 2027"
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Konum *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                    required
                    placeholder="İstanbul, Türkiye"
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Durum *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Bayrak</label>
                  <select
                    value={formData.flag}
                    onChange={(e) => setFormData((p) => ({ ...p, flag: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  >
                    {FLAG_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Sıra</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData((p) => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* EN/RU çevirileri — boş alan sitede Türkçe görünür */}
              <TranslationFields
                fields={[
                  { key: 'name', label: 'Turnuva Adı', source: formData.name },
                  { key: 'date', label: 'Tarih', source: formData.date },
                  { key: 'location', label: 'Konum', source: formData.location },
                ]}
                value={formData.translations}
                onChange={(translations) => setFormData((prev) => ({ ...prev, translations }))}
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
        title="Turnuva silinsin mi?"
        message={
          <>
            <strong className="text-white">{toDelete?.name}</strong> ana sayfadaki takvimden kalıcı olarak silinecek.
            Bu işlem geri alınamaz.
          </>
        }
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
};

export default TournamentsPage;
