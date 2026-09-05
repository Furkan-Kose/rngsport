import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { ChevronLeft, ChevronRight, Loader2, Images, Search, Users } from 'lucide-react';
import api from '../../lib/api';
import StaffPanel from '../../components/admin/StaffPanel';

interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
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

const ITEMS_PER_PAGE = 20;

type Tab = 'customers' | 'staff';

const UsersPage = () => {
  const [tab, setTab] = useState<Tab>('customers');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

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

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

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
      {/* Arama */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="İsim, e-posta veya telefon ara..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
          />
        </div>
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
                    <td className="px-4 py-3 text-white font-medium">{user.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-300 text-sm">{user.email || '-'}</td>
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
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/users/${user.id}/galeri`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium transition-colors"
                      >
                        <Images className="w-4 h-4" />
                        Galeri
                      </Link>
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
        </>
      )}
    </div>
  );
};

export default UsersPage;
