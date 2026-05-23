import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api, { API_URL } from '../../lib/api';
import { getApparatusLabel } from '../../constants/apparatuses';
import UploadDayModal from '../../components/admin/UploadDayModal';

interface ShootingItem {
  packageName: string;
  category: string;
  seriesCount: number;
  quantity: number;
  apparatuses?: string[];
}

interface ShootingEntry {
  id: string;
  position: number;
  athleteName: string;
  clubName: string | null;
  birthYear: string | null;
  category: string | null;
  expectedTime: string | null;
  willBeShot: boolean;
  orderId: string | null;
  reservationId: string | null;
  shootStartedAt: string | null;
  shootEndedAt: string | null;
  createdAt: string;
  customerPhone: string | null;
  notes: string | null;
  status: string | null;
  items: ShootingItem[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Stats {
  total: number;
  willBeShot: number;
  willNotBeShot: number;
  pending: number;
  inProgress: number;
  done: number;
}

interface Day {
  id: string;
  label: string;
  sortOrder: number;
  total: number;
}

type SortKey = 'position' | 'expected' | 'started' | 'name';

const ITEMS_PER_PAGE = 10;

const statusBadge = (willBeShot: boolean) =>
  willBeShot ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
      Çekilecek
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
      Çekilmeyecek
    </span>
  );

const ShootingListPage = () => {
  const [entries, setEntries] = useState<ShootingEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
  });
  const [stats, setStats] = useState<Stats>({
    total: 0,
    willBeShot: 0,
    willNotBeShot: 0,
    pending: 0,
    inProgress: 0,
    done: 0,
  });
  const [days, setDays] = useState<Day[]>([]);
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('position');
  const [isClearing, setIsClearing] = useState(false);
  // Yükleme modalı: null = yeni gün; dolu = o günün üzerine yaz
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadExisting, setUploadExisting] = useState<{ id: string; label: string } | null>(null);

  const fetchList = useCallback(
    async (
      page: number = 1,
      silent: boolean = false,
      dayIdOverride?: string | null,
    ) => {
      if (!silent) setIsLoading(true);
      try {
        const effectiveDay =
          dayIdOverride !== undefined ? dayIdOverride : activeDayId;
        const params = new URLSearchParams({
          page: page.toString(),
          limit: ITEMS_PER_PAGE.toString(),
          sort: sortKey,
        });
        if (searchQuery) params.append('search', searchQuery);
        if (effectiveDay) params.append('dayId', effectiveDay);

        const { data } = await api.get(`/api/shooting-list?${params}`);
        setEntries(data.data);
        setPagination(data.pagination);
        setStats(data.stats);
        setDays(data.days ?? []);
        // Backend'in döndürdüğü aktif günü senkronla (ilk yükleme / silme sonrası)
        const nextActive = data.activeDayId ?? null;
        if (nextActive !== activeDayId) setActiveDayId(nextActive);
      } catch (error) {
        if (!silent) console.error('Çekim listesi alınamadı:', error);
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [searchQuery, sortKey, activeDayId],
  );

  useEffect(() => {
    fetchList(1);
  }, [fetchList]);

  // Push tetiklendiğinde en güncel sayfayı okumak için ref
  const pageRef = useRef(pagination.page);
  useEffect(() => {
    pageRef.current = pagination.page;
  }, [pagination.page]);

  // SSE: backend yeni sipariş/rezervasyon değişikliğinde "refresh" event'i gönderir
  useEffect(() => {
    const source = new EventSource(`${API_URL}/api/shooting-list/stream`, {
      withCredentials: true,
    });

    const handleRefresh = () => {
      fetchList(pageRef.current, true);
    };

    source.addEventListener('refresh', handleRefresh);
    // onerror durumunda EventSource otomatik reconnect denediği için manuel müdahale gereksiz

    return () => {
      source.removeEventListener('refresh', handleRefresh);
      source.close();
    };
  }, [fetchList]);

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchList(newPage);
    }
  };

  const activeDay = days.find((d) => d.id === activeDayId) ?? null;

  const openNewDay = () => {
    setUploadExisting(null);
    setUploadOpen(true);
  };

  const openReupload = () => {
    if (!activeDay) return;
    setUploadExisting({ id: activeDay.id, label: activeDay.label });
    setUploadOpen(true);
  };

  const handleUploaded = (dayId: string) => {
    setActiveDayId(dayId);
    fetchList(1, false, dayId);
  };

  const handleDeleteDay = async () => {
    if (!activeDay) return;
    if (
      !window.confirm(`"${activeDay.label}" günü ve tüm satırları silinecek. Emin misiniz?`)
    )
      return;
    setIsClearing(true);
    try {
      await api.delete(`/api/shooting-list?dayId=${activeDay.id}`);
      toast.success('Gün silindi');
      // Silinen günden çık; backend kalan ilk günü aktif yapacak
      setActiveDayId(null);
      await fetchList(1, false, null);
    } catch (error) {
      console.error('Gün silinemedi:', error);
      toast.error('Gün silinemedi');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Çekim Listesi</h1>
            <p className="text-gray-400 mt-1 text-xs sm:text-sm">
              Excel'den yüklenen sporcuların çekim takibi
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={openNewDay}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni Gün
          </button>
          {activeDay && (
            <>
              <button
                onClick={openReupload}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Yeniden Yükle
              </button>
              <button
                onClick={handleDeleteDay}
                disabled={isClearing}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isClearing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Bu Günü Sil
              </button>
            </>
          )}
        </div>
      </div>

      {/* Gün sekmeleri */}
      {days.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap border-b border-gray-700 pb-px">
          {days.map((day) => (
            <button
              key={day.id}
              onClick={() => setActiveDayId(day.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium border-b-2 -mb-px transition-colors ${
                day.id === activeDayId
                  ? 'border-amber-500 text-amber-400 bg-gray-800/50'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800/30'
              }`}
            >
              {day.label}
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                  day.id === activeDayId
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {day.total}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard label="Toplam" value={stats.total} tone="neutral" />
        <StatCard label="Çekilecek" value={stats.willBeShot} tone="emerald" />
        <StatCard
          label="Çekilmeyecek"
          value={stats.willNotBeShot}
          tone="gray"
        />
        <StatCard label="Devam Eden" value={stats.inProgress} tone="emerald" />
        <StatCard label="Tamamlanan" value={stats.done} tone="amber" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Sporcu veya kulüp ara..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="position">Excel Sırasına Göre</option>
          <option value="expected">Beklenen Saate Göre</option>
          <option value="started">Başlangıç Saatine Göre</option>
          <option value="name">Sporcu Adına Göre</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center">
            <Camera className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              {days.length === 0
                ? 'Henüz gün eklenmedi. "Yeni Gün" ile ilk Excel\'i yükleyin.'
                : searchQuery
                ? 'Aramayla eşleşen kayıt yok.'
                : 'Bu günde kayıt yok.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-gray-700/50">
              {entries.map((entry) => {
                const disabledRow = !entry.willBeShot;
                const hasItems = entry.items.length > 0;
                const hasNotes = !!entry.notes;
                return (
                  <div
                    key={entry.id}
                    className={`p-4 transition-colors ${disabledRow ? 'opacity-60' : ''}`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-gray-500 font-mono text-xs">#{entry.position}</span>
                        {statusBadge(entry.willBeShot)}
                        {entry.category && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {entry.category}
                          </span>
                        )}
                      </div>
                      <p className="text-white font-medium truncate">{entry.athleteName}</p>
                      <p className="text-gray-400 text-xs truncate">{entry.clubName || '—'}</p>
                      <p className="text-gray-500 text-[11px] mt-0.5">
                        {[entry.birthYear, entry.customerPhone].filter(Boolean).join(' • ') || '—'}
                      </p>
                    </div>

                    <div className="mt-3 bg-gray-900/40 rounded-md p-2 text-[11px]">
                      <p className="text-gray-500 uppercase tracking-wide">Beklenen</p>
                      <p className={`font-mono mt-0.5 ${entry.expectedTime ? 'text-white' : 'text-gray-600'}`}>
                        {entry.expectedTime || '—'}
                      </p>
                    </div>

                    <div className="mt-2 bg-gray-900/40 rounded-md p-2 text-[11px]">
                      <p className="text-gray-500 uppercase tracking-wide">Paket / Seri / Not</p>
                      {!hasItems && !hasNotes ? (
                        <p className="text-gray-600 mt-0.5">—</p>
                      ) : (
                        <div className="mt-0.5 space-y-1.5">
                          {hasItems &&
                            entry.items.map((it, i) => (
                              <div key={i}>
                                <p className="text-gray-300">
                                  <span className="text-white">{it.packageName}</span>
                                  <span className="text-gray-500">
                                    {' · '}
                                    {it.seriesCount}'li × {it.quantity}
                                  </span>
                                </p>
                                {it.apparatuses && it.apparatuses.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {it.apparatuses.map((slug) => (
                                      <span
                                        key={slug}
                                        className="inline-flex items-center px-1.5 py-0 rounded text-[10px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/25"
                                      >
                                        {getApparatusLabel(slug)}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          {hasNotes && (
                            <p
                              className="text-gray-500 line-clamp-2"
                              title={entry.notes ?? undefined}
                            >
                              <span className="text-gray-400">Not:</span> {entry.notes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wider bg-gray-900/50">
                    <th className="px-5 py-3 font-medium">Sıra</th>
                    <th className="px-5 py-3 font-medium">Sporcu</th>
                    <th className="px-5 py-3 font-medium">Kulüp</th>
                    <th className="px-5 py-3 font-medium">Alet</th>
                    <th className="px-5 py-3 font-medium">Durum</th>
                    <th className="px-5 py-3 font-medium">Beklenen</th>
                    <th className="px-5 py-3 font-medium">Paket / Seri / Not</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {entries.map((entry) => {
                    const disabledRow = !entry.willBeShot;
                    const hasItems = entry.items.length > 0;
                    const hasNotes = !!entry.notes;

                    return (
                      <tr
                        key={entry.id}
                        className={`transition-colors ${
                          disabledRow
                            ? 'opacity-50 hover:opacity-70 hover:bg-gray-700/20'
                            : 'hover:bg-gray-700/20'
                        }`}
                      >
                        <td className="px-5 py-3 text-gray-400 font-mono text-sm align-top">
                          {entry.position}
                        </td>
                        <td className="px-5 py-3 align-top">
                          <div>
                            <p className="text-white font-medium">
                              {entry.athleteName}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {[entry.birthYear, entry.customerPhone]
                                .filter(Boolean)
                                .join(' • ') || '—'}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-300 text-sm align-top">
                          {entry.clubName || '—'}
                        </td>
                        <td className="px-5 py-3 align-top">
                          {entry.category ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {entry.category}
                            </span>
                          ) : (
                            <span className="text-gray-600 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 align-top">
                          {statusBadge(entry.willBeShot)}
                        </td>
                        <td className="px-5 py-3 align-top">
                          {entry.expectedTime ? (
                            <span className="text-white font-mono text-sm">
                              {entry.expectedTime}
                            </span>
                          ) : (
                            <span className="text-gray-600 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-sm align-top">
                          {!hasItems && !hasNotes ? (
                            <span className="text-gray-600">—</span>
                          ) : (
                            <div className="space-y-1.5">
                              {hasItems &&
                                entry.items.map((it, i) => (
                                  <div key={i}>
                                    <p className="text-gray-300">
                                      <span className="text-white">
                                        {it.packageName}
                                      </span>
                                      <span className="text-gray-500">
                                        {' · '}
                                        {it.seriesCount}'li × {it.quantity}
                                      </span>
                                    </p>
                                    {it.apparatuses && it.apparatuses.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-0.5">
                                        {it.apparatuses.map((slug) => (
                                          <span
                                            key={slug}
                                            className="inline-flex items-center px-1.5 py-0 rounded text-[10px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/25"
                                          >
                                            {getApparatusLabel(slug)}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              {hasNotes && (
                                <p
                                  className="text-gray-500 text-xs line-clamp-1"
                                  title={entry.notes ?? undefined}
                                >
                                  <span className="text-gray-400">Not:</span>{' '}
                                  {entry.notes}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <PaginationControls
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      <UploadDayModal
        open={uploadOpen}
        existingDay={uploadExisting}
        onClose={() => setUploadOpen(false)}
        onUploaded={handleUploaded}
      />
    </div>
  );
};

interface PaginationControlsProps {
  pagination: Pagination;
  onPageChange: (page: number) => void;
}

const PaginationControls = ({
  pagination,
  onPageChange,
}: PaginationControlsProps) => {
  const { page, totalPages, total } = pagination;
  if (totalPages <= 1) return null;

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const showPages = 5;
    if (totalPages <= showPages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (page <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (page >= totalPages - 2) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = page - 1; i <= page + 1; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-700">
      <div className="text-sm text-gray-400">
        Toplam <span className="text-white font-medium">{total}</span> kayıt
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {getPageNumbers().map((p, i) => (
          <button
            key={i}
            onClick={() => typeof p === 'number' && onPageChange(p)}
            disabled={p === '...'}
            className={`min-w-9 h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
              p === page
                ? 'bg-amber-500 text-white'
                : p === '...'
                ? 'text-gray-500 cursor-default'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: number;
  tone: 'neutral' | 'gray' | 'emerald' | 'amber';
}

const StatCard = ({ label, value, tone }: StatCardProps) => {
  const toneClass: Record<StatCardProps['tone'], string> = {
    neutral: 'text-white',
    gray: 'text-gray-300',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
  };
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${toneClass[tone]}`}>{value}</p>
    </div>
  );
};

export default ShootingListPage;
