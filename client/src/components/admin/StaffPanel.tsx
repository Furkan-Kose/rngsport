import { useCallback, useEffect, useState } from 'react';
import { Camera, Pencil, Plus, ShieldCheck, Trash2, Video } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { ROLES, roleLabel } from '../../lib/roles';
import StaffFormModal, { type StaffUser } from './StaffFormModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import {
  Button,
  EmptyState,
  IconButton,
  Panel,
  SkeletonRows,
} from './ui';
import { tableBodyClass, tableHeadRowClass } from '../../lib/adminUi';

// Panel hesapları yönetimi: yöneticiler + saha personeli (fotoğrafçı / videocu).
// Personel panelde sadece Çekim Listesi'ni görür; yönetici her şeyi.
const StaffPanel = () => {
  const { user: currentUser } = useAuth();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [toDelete, setToDelete] = useState<StaffUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!toDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/users/staff/${toDelete.id}`);
      toast.success('Personel silindi');
      setToDelete(null);
      await fetchStaff();
    } catch (error) {
      console.error('Personel silinemedi:', error);
      toast.error(
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Personel silinemedi',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));

  const roleBadgeStyles: Record<string, { icon: typeof Camera; className: string }> = {
    [ROLES.ADMIN]: {
      icon: ShieldCheck,
      className: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    [ROLES.PHOTOGRAPHER]: {
      icon: Camera,
      className: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
    [ROLES.VIDEOGRAPHER]: {
      icon: Video,
      className: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
  };

  const roleBadge = (role: string) => {
    const { icon: Icon, className } =
      roleBadgeStyles[role] ?? roleBadgeStyles[ROLES.VIDEOGRAPHER];
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full border ${className}`}
      >
        <Icon className="w-3 h-3" />
        {roleLabel(role)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-gray-400 text-sm">
          Yönetici, fotoğrafçı ve videocu hesapları. Fotoğrafçı ve videocu panelde sadece Çekim Listesi&apos;ni görür.
        </p>
        <Button variant="primary" icon={Plus} onClick={openCreate} className="self-start sm:self-auto">
          Hesap Ekle
        </Button>
      </div>

      {isLoading ? (
        <Panel className="overflow-hidden">
          <SkeletonRows rows={4} />
        </Panel>
      ) : staff.length === 0 ? (
        <EmptyState icon={Camera} title="Henüz personel hesabı yok" />
      ) : (
        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className={tableHeadRowClass}>
                  <th className="px-4 py-3 font-medium">Ad Soyad</th>
                  <th className="px-4 py-3 font-medium">Kullanıcı Adı</th>
                  <th className="px-4 py-3 font-medium">Görev</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Kayıt Tarihi</th>
                  <th className="px-4 py-3 font-medium text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className={tableBodyClass}>
                {staff.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-700/20 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">
                      {user.name || '-'}
                      {user.id === currentUser?.id && (
                        <span className="ml-2 text-[11px] font-normal text-amber-400">(Siz)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-sm font-mono">
                      {user.username || '-'}
                    </td>
                    <td className="px-4 py-3">{roleBadge(user.role)}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm hidden lg:table-cell">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <IconButton icon={Pencil} title="Düzenle" onClick={() => openEdit(user)} />
                        {user.id !== currentUser?.id && (
                          <IconButton icon={Trash2} title="Sil" tone="danger" onClick={() => setToDelete(user)} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <ConfirmDeleteModal
        open={!!toDelete}
        title="Personel hesabı silinsin mi?"
        message={
          toDelete && (
            <>
              <strong className="text-white">{toDelete.name || toDelete.username}</strong> hesabı kalıcı olarak
              silinecek. Bu işlem geri alınamaz.
            </>
          )
        }
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />

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
