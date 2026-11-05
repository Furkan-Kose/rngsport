import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, CheckSquare, Eye, FileSpreadsheet, Plus, Pencil, Trash2, X } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-toastify';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import BulkStatusBar from '../../components/admin/BulkStatusBar';
import DiscountLine from '../../components/admin/DiscountLine';
import StatusBadge from '../../lib/orderStatus';
import ReservationFormModal from '../../components/admin/ReservationFormModal';
import { useRecordsLiveRefresh } from '../../hooks/useRecordsLiveRefresh';
import { useUrlState } from '../../hooks/useUrlState';
import ExportModal from '../../components/admin/ExportModal';
import PhoneLinks from '../../components/admin/PhoneLinks';
import { getApparatusLabel } from '../../constants/apparatuses';
import { ListMatchLegend, ListMatchWarning } from '../../components/admin/ShootingListMatch';
import { listMatchTint, type ListMatchFields } from '../../lib/listMatch';

import PriorityBadge from '../../components/PriorityBadge';
import DeliveryPanel, { DeliveryIcons } from '../../components/admin/DeliveryPanel';
import type { Deliveries } from '../../lib/delivery';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import {
  Button,
  EmptyState,
  FilterTabs,
  IconButton,
  SkeletonRows,
  SortableTh,
  PageHeader,
  Pagination as PaginationBar,
  Panel,
  SearchInput,
  Toolbar,
} from '../../components/admin/ui';
import { tableBodyClass, tableHeadRowClass, thClass } from '../../lib/adminUi';

// Durum sekmeleri (sayılar liste cevabındaki counts'tan)
const STATUS_TABS = [
  { key: 'all', label: 'Tümü' },
  { key: 'PENDING', label: 'Bekliyor' },
  { key: 'CONFIRMED', label: 'Onaylandı' },
  { key: 'PAID', label: 'Ödendi' },
  { key: 'DELIVERED', label: 'Teslim Edildi' },
  { key: 'CANCELLED', label: 'İptal' },
] as const;

interface ReservationItem {
  packageId: string;
  packageName: string;
  category: string;
  price: number;
  seriesCount: number;
  quantity: number;
  apparatuses: string[];
  priority?: boolean;
}

interface Reservation extends ListMatchFields {
  id: string;
  athleteName: string;
  clubName: string;
  birthYear: string;
  customerPhone: string;
  customerEmail: string;
  notes: string | null;
  subtotal: number | null;
  discountPercent: number;
  discountAmount: number;
  totalPrice: number;
  status: string;
  deliveries?: Deliveries;
  createdAt: string;
  items: ReservationItem[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ITEMS_PER_PAGE = 10;

const ReservationsPage = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // Sekme, arama, sayfa, sıralama ve açık detay adres çubuğunda (yenileme / geri tuşu / link paylaşımı)
  const [url, setUrl] = useUrlState({ status: 'all', q: '', page: '1', sort: '', dir: 'desc', id: '', limit: String(ITEMS_PER_PAGE) });
  const pageSize = [10, 25, 50, 100].includes(Number(url.limit)) ? Number(url.limit) : ITEMS_PER_PAGE;
  const filterStatus = url.status;
  const setFilterStatus = (status: string) => setUrl({ status, page: '1' });
  const [exportOpen, setExportOpen] = useState(false);
  // Toplu işlem: Seç → işaretle → Onayla / Ödendi / İptal
  const bulk = useBulkSelection();
  const { selectMode, setSelectMode, selectedIds } = bulk;
  const [counts, setCounts] = useState<Record<string, number>>({});
  const searchQuery = url.q;
  const [searchInput, setSearchInput] = useState(url.q);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editTarget, setEditTarget] = useState<Reservation | null>(null);

  // silent: arka plan yenilemesi (canlı akış) — yükleniyor göstergesi çıkmaz
  const fetchReservations = useCallback(async (page: number = 1, silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });
      
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (url.sort) {
        params.append('sort', url.sort);
        params.append('dir', url.dir);
      }

      const { data } = await api.get(`/api/reservations?${params}`);
      setReservations(data.data);
      setPagination(data.pagination);
      setCounts(data.counts ?? {});
    } catch (error) {
      console.error('Reservations fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, searchQuery, url.sort, url.dir, pageSize]);

  useEffect(() => {
    fetchReservations(Math.max(1, Number(url.page) || 1));
  }, [fetchReservations, url.page]);

  // Başka bir admin rezervasyon ekler/düzenlerse ya da müşteri kendi rezervasyonunu
  // değiştirirse liste kendiliğinden yenilenir. Detay / form / silme penceresi açıkken bekler.
  useRecordsLiveRefresh(
    () => fetchReservations(pagination.page, true),
    !!selectedReservation || formModalOpen || !!deleteConfirmId || selectMode,
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.trim() !== searchQuery) setUrl({ q: searchInput.trim(), page: '1' });
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // ?id= ile gelindi (Dashboard / hızlı arama / paylaşılan link): kaydı bulup detayı aç.
  // Listede yoksa tek kayıt isteğiyle (aynı admin biçimi) getirilir.
  useEffect(() => {
    if (!url.id || selectedReservation?.id === url.id) return;
    const inList = reservations.find((r) => r.id === url.id);
    if (inList) {
      setSelectedReservation(inList);
      return;
    }
    let cancelled = false;
    api
      .get('/api/reservations', { params: { id: url.id, limit: 1 } })
      .then(({ data }) => {
        if (cancelled) return;
        if (data.data?.[0]) setSelectedReservation(data.data[0]);
        else {
          toast.error('Kayıt bulunamadı');
          setUrl({ id: '' });
        }
      })
      .catch(() => !cancelled && setUrl({ id: '' }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url.id, reservations]);

  const handleSort = (sort: string, dir: 'asc' | 'desc' | null) =>
    setUrl(dir ? { sort, dir, page: '1' } : { sort: '', dir: 'desc', page: '1' });

  // Detay aç/kapat: açık kayıt adres çubuğunda (?id=) durur
  const openDetail = (reservation: Reservation | null) => {
    setSelectedReservation(reservation);
    setUrl({ id: reservation?.id ?? '' });
  };

  const toggleSelect = bulk.toggle;
  const exitSelectMode = bulk.exit;
  const selectedNames = reservations.filter((r) => selectedIds.has(r.id)).map((r) => r.athleteName);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setUrl({ page: String(newPage) });
    }
  };

  const updateReservationStatus = async (reservationId: string, status: string) => {
    try {
      await api.put(`/api/reservations/${reservationId}`, { status });
      
      setReservations((prev) =>
        prev.map((r) => (r.id === reservationId ? { ...r, status } : r))
      );
      if (selectedReservation?.id === reservationId) {
        setSelectedReservation({ ...selectedReservation, status });
      }
    } catch (error) {
      console.error('Update reservation error:', error);
    }
  };

  // Teslimat bölümünden gelen durum + teslimat tarihleri
  const applyDelivery = (reservationId: string, changes: { status: string; deliveries: Deliveries }) => {
    setReservations((prev) => prev.map((r) => (r.id === reservationId ? { ...r, ...changes } : r)));
    setSelectedReservation((prev) => (prev?.id === reservationId ? { ...prev, ...changes } : prev));
  };

  const deleteReservation = async (reservationId: string) => {
    setIsDeleting(true);
    try {
      await api.delete(`/api/reservations/${reservationId}`);
      
      // Listeden kaldır
      setReservations((prev) => prev.filter((r) => r.id !== reservationId));
      
      // Eğer detay modalı açıksa kapat
      if (selectedReservation?.id === reservationId) {
        openDetail(null);
      }
      
      // Pagination güncelle
      setPagination((prev) => ({
        ...prev,
        total: prev.total - 1,
        totalPages: Math.ceil((prev.total - 1) / prev.limit),
      }));
      
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Delete reservation error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const openCreateModal = () => {
    setEditTarget(null);
    setFormMode('create');
    setFormModalOpen(true);
  };

  const openEditModal = (reservation: Reservation) => {
    setEditTarget(reservation);
    setFormMode('edit');
    setFormModalOpen(true);
  };

  const handleFormSaved = () => {
    fetchReservations(pagination.page);
    if (selectedReservation) {
      openDetail(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };


  // Onaylı/ödenmiş rezervasyonun çekim listesiyle isim + alet eşleşmesi:
  // yeşil eşleşiyor, turuncu alet uyuşmuyor, kırmızı isim yok (bkz. lib/listMatch)
  const isActive = (r: Reservation) =>
    r.status === 'CONFIRMED' || r.status === 'PAID' || r.status === 'DELIVERED';
  const getRowTint = (r: Reservation) => (isActive(r) ? listMatchTint(r.listMatch) : '');

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      photo: 'Fotoğraf',
      video: 'Video',
      full: 'Full Paket',
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rezervasyonlar"
        icon={CalendarDays}
        description="Nakit ödemeli rezervasyonları görüntüleyin ve yönetin."
        actions={
          <>
            <Button icon={FileSpreadsheet} onClick={() => setExportOpen(true)}>
              Excel İndir
            </Button>
            <Button variant="primary" icon={Plus} onClick={openCreateModal}>
              Yeni Rezervasyon
            </Button>
          </>
        }
      />

      <Toolbar>
        <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Sporcu, kulüp veya telefon ara..." />
        <FilterTabs
          tabs={STATUS_TABS.map((t) => ({
            key: t.key,
            label: t.label,
            count: t.key === 'all' ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[t.key] ?? 0,
          }))}
          value={filterStatus}
          onChange={setFilterStatus}
        />
        <div className="lg:ml-auto shrink-0">
          {selectMode ? (
            <Button size="sm" variant="ghost" icon={X} onClick={exitSelectMode}>
              Seçimi bitir
            </Button>
          ) : (
            <Button size="sm" icon={CheckSquare} onClick={() => setSelectMode(true)} disabled={reservations.length === 0}>
              Seç (toplu işlem)
            </Button>
          )}
        </div>
      </Toolbar>

      {selectMode && (
        <div className="flex flex-wrap items-center gap-2 -mt-2">
          <span className="text-sm text-white font-medium">
            {selectedIds.size} seçili
            {selectedIds.size > selectedNames.length && (
              <span className="text-gray-400 font-normal"> (diğer sayfalardakiler dahil)</span>
            )}
          </span>
          <Button size="sm" variant="ghost" onClick={() => bulk.toggleAll(reservations.map((r) => r.id))}>
            Bu sayfadakilerin tümü ({reservations.length})
          </Button>
          {selectedIds.size > 0 && (
            <Button size="sm" variant="ghost" onClick={bulk.clear}>
              Temizle
            </Button>
          )}
        </div>
      )}

      {/* Reservations Table */}
      <Panel className="overflow-hidden">
        {isLoading ? (
          <SkeletonRows />
        ) : reservations.length === 0 ? (
          <EmptyState bare icon={CalendarDays} title="Rezervasyon bulunamadı" description={searchQuery || filterStatus !== 'all' ? 'Arama veya filtreyi değiştirmeyi deneyin.' : undefined} />
        ) : (
          <>
            {/* Çekim listesi eşleşme açıklaması (yalnızca onaylı/ödenmiş rezervasyonlarda) */}
            <ListMatchLegend scope="onaylanan/ödenen rezervasyonlar" />

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-700/50">
              {reservations.map((reservation) => (
                <div key={reservation.id} className={`p-4 ${getRowTint(reservation)} ${selectedIds.has(reservation.id) ? 'bg-amber-500/10' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    {selectMode && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(reservation.id)}
                        onChange={() => toggleSelect(reservation.id)}
                        className="mt-1 w-5 h-5 accent-amber-500 shrink-0"
                        aria-label={`${reservation.athleteName} seç`}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">{reservation.athleteName}</p>
                      <p className="text-gray-400 text-xs truncate">
                        {reservation.clubName} {reservation.birthYear ? `• ${reservation.birthYear}` : ''}
                      </p>
                      <PhoneLinks phone={reservation.customerPhone} className="mt-1 text-xs" />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-white font-semibold">{formatPrice(reservation.totalPrice)}</p>
                      <div className="mt-1.5 flex items-center justify-end gap-1.5"><DeliveryIcons deliveries={reservation.deliveries} /><StatusBadge status={reservation.status} /></div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs mt-2">{formatDate(reservation.createdAt)}</p>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <Button size="sm" icon={Eye} onClick={() => openDetail(reservation)}>
                      Detay
                    </Button>
                    <Button size="sm" icon={Pencil} onClick={() => openEditModal(reservation)}>
                      Düzenle
                    </Button>
                    <Button size="sm" variant="danger" icon={Trash2} onClick={() => setDeleteConfirmId(reservation.id)}>
                      Sil
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={tableHeadRowClass}>
                    {selectMode && (
                      <th className="pl-4 py-3 w-8">
                        <input
                          type="checkbox"
                          checked={reservations.length > 0 && reservations.every((r) => selectedIds.has(r.id))}
                          onChange={() => bulk.toggleAll(reservations.map((r) => r.id))}
                          className="w-4 h-4 accent-amber-500"
                          aria-label="Bu sayfadakilerin tümünü seç"
                        />
                      </th>
                    )}
                    <SortableTh label="Sporcu" field="athleteName" sort={url.sort} dir={url.dir as 'asc' | 'desc'} onSort={handleSort} />
                    <SortableTh label="Kulüp" field="clubName" sort={url.sort} dir={url.dir as 'asc' | 'desc'} onSort={handleSort} />
                    <th className={thClass}>Telefon</th>
                    <SortableTh label="Tutar" field="totalPrice" sort={url.sort} dir={url.dir as 'asc' | 'desc'} onSort={handleSort} />
                    <SortableTh label="Durum" field="status" sort={url.sort} dir={url.dir as 'asc' | 'desc'} onSort={handleSort} />
                    <SortableTh label="Tarih" field="createdAt" sort={url.sort} dir={url.dir as 'asc' | 'desc'} onSort={handleSort} />
                    <th className={thClass}>İşlemler</th>
                  </tr>
                </thead>
                <tbody className={tableBodyClass}>
                  {reservations.map((reservation) => (
                    <tr
                      key={reservation.id}
                      onClick={selectMode ? () => toggleSelect(reservation.id) : undefined}
                      className={`hover:bg-gray-700/20 transition-colors ${getRowTint(reservation)} ${
                        selectMode ? 'cursor-pointer' : ''
                      } ${selectedIds.has(reservation.id) ? 'bg-amber-500/10' : ''}`}
                    >
                      {selectMode && (
                        <td className="pl-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(reservation.id)}
                            onChange={() => toggleSelect(reservation.id)}
                            className="w-4 h-4 accent-amber-500"
                            aria-label={`${reservation.athleteName} seç`}
                          />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white font-medium">{reservation.athleteName}</p>
                          <p className="text-gray-400 text-xs">{reservation.birthYear}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{reservation.clubName}</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <PhoneLinks phone={reservation.customerPhone} />
                      </td>
                      <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{formatPrice(reservation.totalPrice)}</td>
                      <td className="px-4 py-3"><div className="flex items-center gap-1.5"><StatusBadge status={reservation.status} /><DeliveryIcons deliveries={reservation.deliveries} /></div></td>
                      <td className="px-4 py-3 text-gray-400 text-sm whitespace-nowrap">{formatDate(reservation.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <IconButton icon={Eye} title="Detay" onClick={() => openDetail(reservation)} />
                          <IconButton icon={Pencil} title="Düzenle" onClick={() => openEditModal(reservation)} />
                          <IconButton icon={Trash2} title="Sil" tone="danger" onClick={() => setDeleteConfirmId(reservation.id)} />
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
              onLimitChange={(n) => setUrl({ limit: String(n), page: '1' })}
            />
          </>
        )}
      </Panel>

      {/* Reservation Detail Modal */}
      {selectedReservation && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold text-white">Rezervasyon Detayı</h2>
              <button
                onClick={() => openDetail(null)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {isActive(selectedReservation) && (
                <ListMatchWarning
                  listMatch={selectedReservation.listMatch}
                  unmatchedApparatuses={selectedReservation.unmatchedApparatuses}
                />
              )}

              {/* Reservation Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <p className="text-gray-400 text-sm">Rezervasyon ID</p>
                  <p className="text-white font-mono text-xs sm:text-sm break-all">{selectedReservation.id}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Durum</p>
                  <div className="mt-1"><StatusBadge status={selectedReservation.status} /></div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Sporcu Adı</p>
                  <p className="text-white">{selectedReservation.athleteName}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Doğum Yılı</p>
                  <p className="text-white">{selectedReservation.birthYear}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Kulüp</p>
                  <p className="text-white">{selectedReservation.clubName}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Telefon</p>
                  <PhoneLinks phone={selectedReservation.customerPhone} />
                </div>
                <div className="sm:col-span-2">
                  <p className="text-gray-400 text-sm">Tarih</p>
                  <p className="text-white">{formatDate(selectedReservation.createdAt)}</p>
                </div>
                {selectedReservation.notes && (
                  <div className="sm:col-span-2">
                    <p className="text-gray-400 text-sm">Notlar</p>
                    <p className="text-white">{selectedReservation.notes}</p>
                  </div>
                )}
              </div>

              {/* Reservation Items */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Rezervasyon Kalemleri</h3>
                <div className="space-y-2">
                  {selectedReservation.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gray-900/50 rounded-lg p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium truncate">{item.packageName}<PriorityBadge show={item.priority} /></p>
                        <p className="text-gray-400 text-xs sm:text-sm">
                          {getCategoryLabel(item.category)} • {item.seriesCount} Seri x {item.quantity} Adet
                        </p>
                        {item.apparatuses && item.apparatuses.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {item.apparatuses.map((slug) => (
                              <span
                                key={slug}
                                className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30"
                              >
                                {getApparatusLabel(slug)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-white font-medium shrink-0">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
                <DiscountLine
                  subtotal={selectedReservation.subtotal}
                  discountPercent={selectedReservation.discountPercent}
                  discountAmount={selectedReservation.discountAmount}
                  formatPrice={formatPrice}
                />
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
                  <span className="text-lg font-medium text-white">Toplam</span>
                  <span className="text-xl font-bold text-violet-400">
                    {formatPrice(selectedReservation.totalPrice)}
                  </span>
                </div>
              </div>

              <DeliveryPanel
                kind="reservations"
                record={selectedReservation}
                onUpdated={(changes) => applyDelivery(selectedReservation.id, changes)}
              />

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-700">
                <span className="text-gray-400 text-sm mr-2 self-center">Durumu değiştir:</span>
                {['PENDING', 'CONFIRMED', 'PAID', 'DELIVERED', 'CANCELLED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => updateReservationStatus(selectedReservation.id, status)}
                    disabled={selectedReservation.status === status}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      status === 'PAID'
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : status === 'CONFIRMED'
                        ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                        : status === 'DELIVERED'
                        ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                        : status === 'CANCELLED'
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                    }`}
                  >
                    {status === 'PENDING'
                      ? 'Bekliyor'
                      : status === 'CONFIRMED'
                      ? 'Onaylandı'
                      : status === 'PAID'
                      ? 'Ödendi'
                      : status === 'DELIVERED'
                      ? 'Teslim Edildi'
                      : 'İptal'}
                  </button>
                ))}
              </div>

              {/* Düzenle / Sil Butonları */}
              <div className="pt-4 border-t border-gray-700 flex gap-2">
                <Button icon={Pencil} className="flex-1" onClick={() => openEditModal(selectedReservation)}>
                  Düzenle
                </Button>
                <Button
                  variant="danger"
                  icon={Trash2}
                  className="flex-1"
                  onClick={() => setDeleteConfirmId(selectedReservation.id)}
                >
                  Rezervasyonu Sil
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Yeni / Düzenle Modal */}
      <ReservationFormModal
        isOpen={formModalOpen}
        mode={formMode}
        initialData={editTarget}
        onClose={() => setFormModalOpen(false)}
        onSaved={handleFormSaved}
      />

      {/* Silme Onay Modal */}
      <ConfirmDeleteModal
        open={!!deleteConfirmId}
        title="Rezervasyon silinsin mi?"
        message={(() => {
          const r = reservations.find((x) => x.id === deleteConfirmId) ?? selectedReservation;
          return (
            <>
              {r && <strong className="text-white">{r.athleteName}</strong>} rezervasyonu kalıcı olarak silinecek. Bu
              işlem geri alınamaz.
            </>
          );
        })()}
        isDeleting={isDeleting}
        onConfirm={() => deleteConfirmId && deleteReservation(deleteConfirmId)}
        onCancel={() => setDeleteConfirmId(null)}
      />
      {/* Toplu işlem çubuğu + onay (tüm durumlar) */}
      {selectMode && (
        <BulkStatusBar
          kind="reservation"
          selectedIds={selectedIds}
          names={selectedNames}
          onDone={() => {
            exitSelectMode();
            fetchReservations(pagination.page, true);
          }}
        />
      )}

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Rezervasyonlar — Excel"
        columnsUrl="/api/reservations/export/columns"
        exportUrl="/api/reservations/export"
        storageKey="reservations"
        fallbackFileName="rezervasyonlar.xlsx"
        initialValues={{ status: filterStatus, search: searchQuery, from: '', to: '', sort: url.sort, dir: url.dir }}
        fields={[
          {
            key: 'status',
            label: 'Durum',
            type: 'select',
            options: STATUS_TABS.map((t) => ({ value: t.key, label: t.key === 'all' ? 'Tüm durumlar' : t.label })),
          },
          { key: 'search', label: 'Arama (sporcu, kulüp, telefon, e-posta)', type: 'text', placeholder: 'Boş = hepsi' },
          { key: 'from', label: 'Başlangıç tarihi', type: 'date' },
          { key: 'to', label: 'Bitiş tarihi', type: 'date' },
        ]}
      />
    </div>
  );
};

export default ReservationsPage;
