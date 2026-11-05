import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { toast } from 'react-toastify';
import { Images, KeyRound, MailWarning, Pencil, Plus, Trash2, UserCheck, Users } from 'lucide-react';
import api from '../../lib/api';
import { useUrlState } from '../../hooks/useUrlState';
import PhoneLinks from '../../components/admin/PhoneLinks';
import StaffPanel from '../../components/admin/StaffPanel';
import CustomerFormModal, { type CustomerUser } from '../../components/admin/CustomerFormModal';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import {
  Button,
  EmptyState,
  IconButton,
  SkeletonRows,
  SortableTh,
  PageHeader,
  Pagination as PaginationBar,
  Panel,
  SearchInput,
  SectionTabs,
  StatCard,
  Toolbar,
} from '../../components/admin/ui';
import { tableBodyClass, tableHeadRowClass } from '../../lib/adminUi';

interface UserRow extends CustomerUser {
  _count: {
    photos: number;
    reservations: number;
    orders: number;
  };
  lastDownloadAt: string | null;
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


const UsersPage = () => {
  // Sekme, arama, sayfa ve sıralama adres çubuğunda (galeriye girip geri dönünce kaybolmasın)
  const [url, setUrl] = useUrlState({ tab: 'customers', q: '', page: '1', sort: '', dir: 'desc' });
  const tab: Tab = url.tab === 'staff' ? 'staff' : 'customers';
  const setTab = (next: Tab) => setUrl({ tab: next, page: '1' });
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const searchQuery = url.q;
  const [searchInput, setSearchInput] = useState(url.q);

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
      if (url.sort) {
        params.append('sort', url.sort);
        params.append('dir', url.dir);
      }

      const { data } = await api.get(`/api/users?${params}`);
      setUsers(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Users fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, url.sort, url.dir]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/api/users/stats');
      setStats(data);
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  }, []);

  useEffect(() => {
    if (tab === 'customers') fetchUsers(Math.max(1, Number(url.page) || 1));
  }, [fetchUsers, url.page, tab]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.trim() !== searchQuery) setUrl({ q: searchInput.trim(), page: '1' });
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handleSort = (sort: string, dir: 'asc' | 'desc' | null) =>
    setUrl(dir ? { sort, dir, page: '1' } : { sort: '', dir: 'desc', page: '1' });
  const sortDir = url.dir as 'asc' | 'desc';

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setUrl({ page: String(newPage) });
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
    <div className="space-y-6">
      <PageHeader
        title="Kullanıcılar"
        icon={Users}
        description="Kayıtlı müşteriler, galeri yönetimi ve saha personeli"
      />

      <SectionTabs<Tab>
        tabs={[
          { key: 'customers', label: 'Müşteriler', count: pagination.total },
          { key: 'staff', label: 'Personel' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'staff' ? (
        <StaffPanel />
      ) : (
        <>
      {/* Özet kartlar */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Toplam müşteri" value={stats.total} icon={Users} tone="amber" />
          <StatCard label="Şifre belirlememiş" value={stats.withoutPassword} icon={KeyRound} tone="yellow" />
          <StatCard label="E-postası doğrulanmamış" value={stats.unverified} icon={MailWarning} tone="red" />
          <StatCard label="Galerisi dolu" value={stats.withPhotos} icon={UserCheck} tone="green" />
        </div>
      )}

      {/* Arama + ekle */}
      <Toolbar className="lg:justify-between">
        <SearchInput value={searchInput} onChange={setSearchInput} placeholder="İsim, e-posta veya telefon ara..." />
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          Müşteri Ekle
        </Button>
      </Toolbar>

      {/* Tablo */}
      {isLoading ? (
        <SkeletonRows />
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title={searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz kayıtlı kullanıcı yok'} />
      ) : (
        <Panel className="overflow-hidden">
          {/* Mobil kartlar */}
          <div className="md:hidden divide-y divide-gray-700/50">
            {users.map((user) => (
              <div key={user.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/admin/users/${user.id}`} className="min-w-0 flex-1">
                    <p className="text-white font-medium truncate">{user.name || '-'}</p>
                    <p className="text-gray-400 text-xs truncate">{user.email || '-'}</p>
                    {user.phone && <p className="text-gray-500 text-xs mt-0.5">{user.phone}</p>}
                  </Link>
                  <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <Images className="w-3 h-3" />
                    {user._count.photos}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1 mt-2">
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
                  <span className="text-[11px] text-gray-500">
                    {user.lastDownloadAt
                      ? `Son indirme ${formatDate(user.lastDownloadAt)}`
                      : user._count.photos > 0
                        ? 'İndirmedi'
                        : `Kayıt ${formatDate(user.createdAt)}`}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    size="sm"
                    icon={Pencil}
                    onClick={() => {
                      setEditing(user);
                      setModalOpen(true);
                    }}
                  >
                    Düzenle
                  </Button>
                  <Button size="sm" variant="soft" icon={Images} to={`/admin/users/${user.id}/galeri`}>
                    Galeri
                  </Button>
                  <Button size="sm" variant="danger" icon={Trash2} className="ml-auto" onClick={() => setDeleting(user)}>
                    Sil
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className={tableHeadRowClass}>
                  <SortableTh label="Ad Soyad" field="name" sort={url.sort} dir={sortDir} onSort={handleSort} />
                  <SortableTh label="E-posta" field="email" sort={url.sort} dir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Telefon</th>
                  <SortableTh label="Fotoğraf" field="photos" sort={url.sort} dir={sortDir} onSort={handleSort} className="text-center" />
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Son İndirme</th>
                  <th className="px-4 py-3 font-medium text-center hidden lg:table-cell">Rezervasyon</th>
                  <SortableTh label="Kayıt Tarihi" field="createdAt" sort={url.sort} dir={sortDir} onSort={handleSort} className="hidden lg:table-cell" />
                  <th className="px-4 py-3 font-medium text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className={tableBodyClass}>
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
                    <td className="px-4 py-3 text-sm hidden md:table-cell">
                      <PhoneLinks phone={user.phone} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        {user._count.photos}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell">
                      {user.lastDownloadAt ? (
                        <span className="text-gray-300">{formatDate(user.lastDownloadAt)}</span>
                      ) : user._count.photos > 0 ? (
                        <span className="text-red-400/80">İndirmedi</span>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-300 text-sm hidden lg:table-cell">
                      {user._count.reservations + user._count.orders}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm hidden lg:table-cell">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <IconButton
                          icon={Pencil}
                          title="Düzenle"
                          onClick={() => {
                            setEditing(user);
                            setModalOpen(true);
                          }}
                        />
                        <IconButton icon={Images} title="Galeri" tone="accent" to={`/admin/users/${user.id}/galeri`} />
                        <IconButton icon={Trash2} title="Sil" tone="danger" onClick={() => setDeleting(user)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationBar
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onChange={handlePageChange}
          />
        </Panel>
      )}

      <CustomerFormModal
        open={modalOpen}
        customer={editing}
        onClose={() => setModalOpen(false)}
        onSaved={refresh}
      />

      <ConfirmDeleteModal
        open={!!deleting}
        title="Müşteri silinsin mi?"
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
