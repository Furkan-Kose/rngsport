import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { toast } from 'react-toastify';
import {
  ChevronLeft,
  ChevronRight,
  Images,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import api from '../../lib/api';
import StaffPanel from '../../components/admin/StaffPanel';
import CustomerFormModal, { type CustomerUser } from '../../components/admin/CustomerFormModal';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';

interface UserRow extends CustomerUser {
  _count: {
    photos: number;
    reservations: number;
    orders: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CustomerStats {
  total: number;
  withoutPassword: number;
  unverified: number;
  withPhotos: number;
}

const ITEMS_PER_PAGE = 20;

type Tab = 'customers' | 'staff';

const errorMessage = (err: unknown) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
  'Bir hata oluştu';

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3">
    <p className="text-2xl font-bold text-white">{value}</p>
    <p className="text-xs text-gray-400 mt-0.5">{label}</p>
  </div>
);

const UsersPage = () => {
  const [tab, setTab] = useState<Tab>('customers');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState<UserRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      });
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const { data } = await api.get(`/api/users?${params}`);
      setUsers(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Users fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/api/users/stats');
      setStats(data);
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  }, []);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchUsers(newPage);
    }
  };

  // Kaydetme/silme sonrası: liste aynı sayfada kalsın, kartlar da tazelensin
  const refresh = () => {
    fetchUsers(pagination.page);
    fetchStats();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      const { data } = await api.delete(`/api/users/${deleting.id}`);
      toast.success(
        data.deletedPhotos
          ? `Müşteri silindi (${data.deletedPhotos} dosya kaldırıldı)`
          : 'Müşteri silindi',
      );
      setDeleting(null);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err));
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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Users className="w-7 h-7 text-amber-500" />
          Kullanıcılar
        </h1>
        <p className="text-gray-400 mt-1">
          Kayıtlı müşteriler, galeri yönetimi ve saha personeli
        </p>
      </div>

      {/* Sekmeler */}
      <div className="flex items-center gap-2 border-b border-gray-700 mb-6">
        {([
          ['customers', `Müşteriler (${pagination.total})`],
          ['staff', 'Personel'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2 -mb-px border-b-2 text-sm font-medium transition-colors ${
              tab === key
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'staff' ? (
        <StaffPanel />
      ) : (
        <>
      {/* Özet kartlar */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard label="Toplam müşteri" value={stats.total} />
          <StatCard label="Şifre belirlememiş" value={stats.withoutPassword} />
          <StatCard label="E-postası doğrulanmamış" value={stats.unverified} />
          <StatCard label="Galerisi dolu" value={stats.withPhotos} />
        </div>
      )}

      {/* Arama + ekle */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-60 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="İsim, e-posta veya telefon ara..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Müşteri Ekle
        </button>
      </div>

      {/* Tablo */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-12 text-center">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz kayıtlı kullanıcı yok'}
          </p>
        </div>
      ) : (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700 text-xs uppercase text-gray-400">
                  <th className="px-4 py-3 font-medium">Ad Soyad</th>
                  <th className="px-4 py-3 font-medium">E-posta</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Telefon</th>
                  <th className="px-4 py-3 font-medium text-center">Fotoğraf</th>
                  <th className="px-4 py-3 font-medium text-center hidden lg:table-cell">Rezervasyon</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Kayıt Tarihi</th>
                  <th className="px-4 py-3 font-medium text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-700/20 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/users/${user.id}`}
                        className="text-white font-medium hover:text-amber-400 transition-colors"
                      >
                        {user.name || '-'}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-300 text-sm">{user.email || '-'}</span>
                      {(!user.hasPassword || !user.emailVerified) && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {!user.hasPassword && (
                            <span className="px-1.5 py-0.5 text-[11px] font-medium rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/30">
                              Şifre yok
                            </span>
                          )}
                          {!user.emailVerified && (
                            <span className="px-1.5 py-0.5 text-[11px] font-medium rounded-full border bg-red-500/10 text-red-400 border-red-500/30">
                              Doğrulanmadı
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-sm hidden md:table-cell">
                      {user.phone || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        {user._count.photos}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-300 text-sm hidden lg:table-cell">
                      {user._count.reservations + user._count.orders}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm hidden lg:table-cell">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(user);
                            setModalOpen(true);
                          }}
                          title="Düzenle"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-700 border border-gray-600 text-gray-200 text-sm font-medium transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                          <span className="hidden xl:inline">Düzenle</span>
                        </button>
                        <Link
                          to={`/admin/users/${user.id}/galeri`}
                          title="Galeri"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium transition-colors"
                        >
                          <Images className="w-4 h-4" />
                          <span className="hidden xl:inline">Galeri</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleting(user)}
                          title="Sil"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sayfalama */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                Sayfa {pagination.page} / {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <CustomerFormModal
        open={modalOpen}
        customer={editing}
        onClose={() => setModalOpen(false)}
        onSaved={refresh}
      />

      <ConfirmDeleteModal
        open={!!deleting}
        title="Müşteriyi Sil"
        isDeleting={isDeleting}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
        message={
          deleting && (
            <>
              <strong className="text-white">{deleting.name || deleting.email}</strong> hesabı
              silinecek.
              {deleting._count.photos > 0 && (
                <>
                  {' '}
                  Galerisindeki{' '}
                  <strong className="text-red-400">
                    {deleting._count.photos} dosya kalıcı olarak
                  </strong>{' '}
                  silinecek.
                </>
              )}{' '}
              Sipariş ve rezervasyon kayıtları durur, ancak hesapla bağları kopar. Bu işlem geri
              alınamaz.
            </>
          )
        }
      />
        </>
      )}
    </div>
  );
};

export default UsersPage;
