import { useCallback, useEffect, useState } from 'react';
import { Camera, Loader2, Pencil, Plus, Trash2, Video } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../lib/api';
import { ROLES, roleLabel } from '../../lib/roles';
import StaffFormModal, { type StaffUser } from './StaffFormModal';

// Saha personeli (fotoğrafçı / videocu) yönetimi.
// Bu hesaplar admin panelinde sadece Çekim Listesi'ni görür.
const StaffPanel = () => {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/api/users/staff');
      setStaff(data.data);
    } catch (error) {
      console.error('Personel listesi alınamadı:', error);
      toast.error('Personel listesi alınamadı');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (user: StaffUser) => {
    setEditing(user);
    setModalOpen(true);
  };

  const handleDelete = async (user: StaffUser) => {
    if (!window.confirm(`"${user.name || user.username}" hesabı silinecek. Emin misiniz?`)) {
      return;
    }
    setDeletingId(user.id);
    try {
      await api.delete(`/api/users/staff/${user.id}`);
      toast.success('Personel silindi');
      await fetchStaff();
    } catch (error) {
      console.error('Personel silinemedi:', error);
      toast.error('Personel silinemedi');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));

  const roleBadge = (role: string) => {
    const isPhoto = role === ROLES.PHOTOGRAPHER;
    const Icon = isPhoto ? Camera : Video;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full border ${
          isPhoto
            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
            : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        }`}
      >
        <Icon className="w-3 h-3" />
        {roleLabel(role)}
      </span>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <p className="text-gray-400 text-sm">
          Fotoğrafçı ve videocu hesapları — panelde sadece Çekim Listesi&apos;ni görürler.
        </p>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors self-start"
        >
          <Plus className="w-4 h-4" />
          Personel Ekle
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : staff.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-12 text-center">
          <Camera className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Henüz personel hesabı yok</p>
        </div>
      ) : (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700 text-xs uppercase text-gray-400">
                  <th className="px-4 py-3 font-medium">Ad Soyad</th>
                  <th className="px-4 py-3 font-medium">Kullanıcı Adı</th>
                  <th className="px-4 py-3 font-medium">Görev</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Kayıt Tarihi</th>
                  <th className="px-4 py-3 font-medium text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {staff.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-700/20 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{user.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-300 text-sm font-mono">
                      {user.username || '-'}
                    </td>
                    <td className="px-4 py-3">{roleBadge(user.role)}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm hidden lg:table-cell">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          disabled={deletingId === user.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {deletingId === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <StaffFormModal
        open={modalOpen}
        staff={editing}
        onClose={() => setModalOpen(false)}
        onSaved={fetchStaff}
      />
    </div>
  );
};

export default StaffPanel;
