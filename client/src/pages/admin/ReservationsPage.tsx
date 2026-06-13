import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Plus, Pencil } from 'lucide-react';
import api from '../../lib/api';
import ReservationFormModal from '../../components/admin/ReservationFormModal';
import { getApparatusLabel } from '../../constants/apparatuses';

interface ReservationItem {
  packageId: string;
  packageName: string;
  category: string;
  price: number;
  seriesCount: number;
  quantity: number;
  apparatuses: string[];
}

interface Reservation {
  id: string;
  athleteName: string;
  clubName: string;
  birthYear: string;
  customerPhone: string;
  customerEmail: string;
  notes: string | null;
  totalPrice: number;
  status: string;
  createdAt: string;
  items: ReservationItem[];
  inShootingList?: boolean | null;
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
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editTarget, setEditTarget] = useState<Reservation | null>(null);

  const fetchReservations = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      });
      
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const { data } = await api.get(`/api/reservations?${params}`);
      setReservations(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Reservations fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, searchQuery]);

  useEffect(() => {
    fetchReservations(1);
  }, [filterStatus, searchQuery]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchReservations(newPage);
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

  const deleteReservation = async (reservationId: string) => {
    setIsDeleting(true);
    try {
      await api.delete(`/api/reservations/${reservationId}`);
      
      // Listeden kaldır
      setReservations((prev) => prev.filter((r) => r.id !== reservationId));
      
      // Eğer detay modalı açıksa kapat
      if (selectedReservation?.id === reservationId) {
        setSelectedReservation(null);
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
      setSelectedReservation(null);
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

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      CONFIRMED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      PAID: 'bg-green-500/20 text-green-400 border-green-500/30',
      CANCELLED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    const labels: Record<string, string> = {
      PENDING: 'Bekliyor',
      CONFIRMED: 'Onaylandı',
      PAID: 'Ödendi',
      CANCELLED: 'İptal',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${badges[status] || badges.PENDING}`}>
        {labels[status] || status}
      </span>
    );
  };

  // Onaylı/ödenmiş rezervasyonun sporcusu çekim listesinde mi? (yalnızca isim bazlı)
  // Varsa yeşilimsi, listede yoksa (isim hatalı olabilir) kırmızımsı arka plan.
  const getRowTint = (r: Reservation) => {
    if (r.status !== 'CONFIRMED' && r.status !== 'PAID') return '';
    if (r.inShootingList === true) return 'bg-green-500/5';
    if (r.inShootingList === false) return 'bg-red-500/10';
    return '';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      photo: 'Fotoğraf',
      video: 'Video',
      full: 'Full Paket',
    };
    return labels[category] || category;
  };

  // Pagination component
  const PaginationControls = () => {
    const { page, totalPages, total } = pagination;
    
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages: (number | string)[] = [];
      const showPages = 5;
      
      if (totalPages <= showPages) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        if (page <= 3) {
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
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {getPageNumbers().map((p, i) => (
            <button
              key={i}
              onClick={() => typeof p === 'number' && handlePageChange(p)}
              disabled={p === '...'}
              className={`min-w-9 h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-violet-500 text-white'
                  : p === '...'
                  ? 'text-gray-500 cursor-default'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {p}
            </button>
          ))}
          
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Rezervasyonlar</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">Tüm rezervasyonları görüntüleyin ve yönetin.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Yeni Rezervasyon
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Sporcu, kulüp veya telefon ara..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="all">Tüm Durumlar</option>
          <option value="PENDING">Bekliyor</option>
          <option value="CONFIRMED">Onaylandı</option>
          <option value="PAID">Ödendi</option>
          <option value="CANCELLED">İptal</option>
        </select>
      </div>

      {/* Reservations Table */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          </div>
        ) : reservations.length === 0 ? (
          <div className="p-8 text-center">
            <svg
              className="w-12 h-12 text-gray-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-400">Rezervasyon bulunamadı.</p>
          </div>
        ) : (
          <>
            {/* Çekim listesi eşleşme açıklaması (yalnızca onaylı/ödenmiş rezervasyonlarda) */}
            <div className="px-4 py-2.5 border-b border-gray-700/50 flex items-center gap-4 text-xs text-gray-400 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm bg-green-500/30 border border-green-500/40" />
                Çekim listesinde
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm bg-red-500/30 border border-red-500/40" />
                Listede bulunamadı (isim hatalı olabilir)
              </span>
              <span className="text-gray-500">— yalnızca onaylanan/ödenen rezervasyonlar için</span>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-700/50">
              {reservations.map((reservation) => (
                <div key={reservation.id} className={`p-4 ${getRowTint(reservation)}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">{reservation.athleteName}</p>
                      <p className="text-gray-400 text-xs truncate">
                        {reservation.clubName} {reservation.birthYear ? `• ${reservation.birthYear}` : ''}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">{reservation.customerPhone}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-white font-semibold">{formatPrice(reservation.totalPrice)}</p>
                      <div className="mt-1.5">{getStatusBadge(reservation.status)}</div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs mt-2">{formatDate(reservation.createdAt)}</p>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setSelectedReservation(reservation)}
                      className="px-3 py-1.5 bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-violet-300 rounded-md text-xs font-medium transition-colors"
                    >
                      Detay
                    </button>
                    <button
                      onClick={() => openEditModal(reservation)}
                      className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-md text-xs font-medium transition-colors"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(reservation.id)}
                      className="px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 rounded-md text-xs font-medium transition-colors"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm bg-gray-900/50">
                    <th className="px-6 py-4 font-medium">Sporcu</th>
                    <th className="px-6 py-4 font-medium">Kulüp</th>
                    <th className="px-6 py-4 font-medium">Telefon</th>
                    <th className="px-6 py-4 font-medium">Tutar</th>
                    <th className="px-6 py-4 font-medium">Durum</th>
                    <th className="px-6 py-4 font-medium">Tarih</th>
                    <th className="px-6 py-4 font-medium">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {reservations.map((reservation) => (
                    <tr key={reservation.id} className={`hover:bg-gray-700/20 transition-colors ${getRowTint(reservation)}`}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{reservation.athleteName}</p>
                          <p className="text-gray-400 text-xs">{reservation.birthYear}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{reservation.clubName}</td>
                      <td className="px-6 py-4 text-gray-300">{reservation.customerPhone}</td>
                      <td className="px-6 py-4 text-white font-medium">{formatPrice(reservation.totalPrice)}</td>
                      <td className="px-6 py-4">{getStatusBadge(reservation.status)}</td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{formatDate(reservation.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedReservation(reservation)}
                            className="text-violet-400 hover:text-violet-300 text-sm font-medium"
                          >
                            Detay
                          </button>
                          <button
                            onClick={() => openEditModal(reservation)}
                            className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(reservation.id)}
                            className="text-red-400 hover:text-red-300 text-sm font-medium"
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationControls />
          </>
        )}
      </div>

      {/* Reservation Detail Modal */}
      {selectedReservation && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold text-white">Rezervasyon Detayı</h2>
              <button
                onClick={() => setSelectedReservation(null)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {/* Reservation Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <p className="text-gray-400 text-sm">Rezervasyon ID</p>
                  <p className="text-white font-mono text-xs sm:text-sm break-all">{selectedReservation.id}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Durum</p>
                  <div className="mt-1">{getStatusBadge(selectedReservation.status)}</div>
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
                  <p className="text-white">{selectedReservation.customerPhone}</p>
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
                        <p className="text-white font-medium truncate">{item.packageName}</p>
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
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
                  <span className="text-lg font-medium text-white">Toplam</span>
                  <span className="text-xl font-bold text-violet-400">
                    {formatPrice(selectedReservation.totalPrice)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-700">
                <span className="text-gray-400 text-sm mr-2 self-center">Durumu değiştir:</span>
                {['PENDING', 'CONFIRMED', 'PAID', 'CANCELLED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => updateReservationStatus(selectedReservation.id, status)}
                    disabled={selectedReservation.status === status}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      status === 'PAID'
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : status === 'CONFIRMED'
                        ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                        : status === 'CANCELLED'
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                    }`}
                  >
                    {status === 'PENDING' ? 'Bekliyor' : status === 'CONFIRMED' ? 'Onaylandı' : status === 'PAID' ? 'Ödendi' : 'İptal'}
                  </button>
                ))}
              </div>

              {/* Düzenle / Sil Butonları */}
              <div className="pt-4 border-t border-gray-700 flex gap-2">
                <button
                  onClick={() => openEditModal(selectedReservation)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Düzenle
                </button>
                <button
                  onClick={() => setDeleteConfirmId(selectedReservation.id)}
                  className="flex-1 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
                >
                  Rezervasyonu Sil
                </button>
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
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-60">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Rezervasyonu Sil</h3>
              <p className="text-gray-400 mb-6">
                Bu rezervasyonu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Vazgeç
                </button>
                <button
                  onClick={() => deleteReservation(deleteConfirmId)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Siliniyor...
                    </>
                  ) : (
                    'Evet, Sil'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationsPage;
