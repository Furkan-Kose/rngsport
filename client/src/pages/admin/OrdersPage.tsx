import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Pencil, Save, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../lib/api';
import DiscountLine from '../../components/admin/DiscountLine';
import StatusBadge from '../../lib/orderStatus';
import { APPARATUSES, getApparatusLabel } from '../../constants/apparatuses';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import { ListMatchLegend, ListMatchWarning } from '../../components/admin/ShootingListMatch';
import { listMatchTint, type ListMatchFields } from '../../lib/listMatch';

import PriorityBadge from '../../components/PriorityBadge';

interface OrderItem {
  id: string;
  packageId: string;
  packageName: string;
  category: string;
  price: number;
  seriesCount: number;
  quantity: number;
  apparatuses: string[];
  priority?: boolean;
}

interface Order extends ListMatchFields {
  id: string;
  athleteName: string;
  clubName: string;
  birthYear: string;
  customerPhone: string;
  customerEmail: string | null;
  notes: string | null;
  subtotal: number | null;
  discountPercent: number;
  discountAmount: number;
  totalPrice: number;
  status: string;
  paymentId: string | null;
  createdAt: string;
  items: OrderItem[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ITEMS_PER_PAGE = 10;

interface EditForm {
  athleteName: string;
  clubName: string;
  birthYear: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
}

const inputClass =
  'w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-amber-500';

const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback;

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  // Detay penceresinde düzenleme: müşteri bilgileri + kalem başına aletler.
  // Paket/seri/adet düzenlenmez — online siparişte tutar iyzico'dan tahsil edildi.
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editApparatuses, setEditApparatuses] = useState<Record<string, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchOrders = useCallback(async (page: number = 1) => {
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

      const { data } = await api.get(`/api/orders?${params}`);
      setOrders(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Orders fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, searchQuery]);

  useEffect(() => {
    fetchOrders(1);
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
      fetchOrders(newPage);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/api/orders/${orderId}`, { status });
      
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    } catch (error) {
      console.error('Update order error:', error);
    }
  };

  const openOrder = (order: Order | null) => {
    setSelectedOrder(order);
    setEditForm(null);
    setEditError('');
    setConfirmDelete(false);
  };

  const startEdit = (order: Order) => {
    setEditForm({
      athleteName: order.athleteName,
      clubName: order.clubName,
      birthYear: order.birthYear,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail ?? '',
      notes: order.notes ?? '',
    });
    setEditApparatuses(Object.fromEntries(order.items.map((it) => [it.id, it.apparatuses ?? []])));
    setEditError('');
  };

  const toggleApparatus = (itemId: string, slug: string, max: number) => {
    setEditApparatuses((prev) => {
      const current = prev[itemId] ?? [];
      if (current.includes(slug)) return { ...prev, [itemId]: current.filter((s) => s !== slug) };
      if (current.length >= max) return prev;
      return { ...prev, [itemId]: [...current, slug] };
    });
  };

  const saveEdit = async () => {
    if (!selectedOrder || !editForm) return;
    const incomplete = selectedOrder.items.find(
      (it) => (editApparatuses[it.id] ?? []).length !== it.seriesCount,
    );
    if (incomplete) {
      setEditError('Her kalem için seri sayısı kadar alet seçin');
      return;
    }
    setIsSaving(true);
    setEditError('');
    try {
      const { data } = await api.patch(`/api/orders/${selectedOrder.id}`, {
        ...editForm,
        itemApparatuses: selectedOrder.items.map((it) => ({ id: it.id, apparatuses: editApparatuses[it.id] })),
      });
      const updated: Order = data.order;
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setSelectedOrder(updated);
      setEditForm(null);
      toast.success('Sipariş güncellendi');
      // PATCH yanıtında eşleşme bilgisi yok; ad/alet değişmiş olabilir → listeyi tazele
      fetchOrders(pagination.page);
    } catch (err) {
      setEditError(errorMessage(err, 'Sipariş güncellenemedi'));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteOrder = async () => {
    if (!selectedOrder) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/orders/${selectedOrder.id}`);
      toast.success('Sipariş silindi');
      openOrder(null);
      fetchOrders(pagination.page);
    } catch (err) {
      toast.error(errorMessage(err, 'Sipariş silinemedi'));
    } finally {
      setIsDeleting(false);
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


  // Ödenmiş siparişin çekim listesiyle isim + alet eşleşmesi:
  // yeşil eşleşiyor, turuncu alet uyuşmuyor, kırmızı isim yok (bkz. lib/listMatch)
  const isPaid = (o: Order) => o.status === 'PAID' || o.status === 'DELIVERED';
  const getRowTint = (o: Order) => (isPaid(o) ? listMatchTint(o.listMatch) : '');

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
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Siparişler</h1>
        <p className="text-gray-400 mt-1 text-sm sm:text-base">Tüm siparişleri görüntüleyin ve yönetin.</p>
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
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="all">Tüm Durumlar</option>
          <option value="PENDING">Bekliyor</option>
          <option value="PAID">Ödendi</option>
          <option value="DELIVERED">Teslim Edildi</option>
          <option value="FAILED">Başarısız</option>
          <option value="CANCELLED">İptal</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-gray-400">Sipariş bulunamadı.</p>
          </div>
        ) : (
          <>
            {/* Çekim listesi eşleşme açıklaması (yalnızca ödenmiş siparişlerde) */}
            <ListMatchLegend scope="ödenen siparişler" />

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-700/50">
              {orders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => openOrder(order)}
                  className={`w-full text-left p-4 hover:bg-gray-700/20 transition-colors ${getRowTint(order)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">{order.athleteName}</p>
                      <p className="text-gray-400 text-xs truncate">
                        {order.clubName} {order.birthYear ? `• ${order.birthYear}` : ''}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">{order.customerPhone}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-white font-semibold">{formatPrice(order.totalPrice)}</p>
                      <div className="mt-1.5"><StatusBadge status={order.status} /></div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs mt-2">{formatDate(order.createdAt)}</p>
                </button>
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
                  {orders.map((order) => (
                    <tr key={order.id} className={`hover:bg-gray-700/20 transition-colors ${getRowTint(order)}`}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{order.athleteName}</p>
                          <p className="text-gray-400 text-xs">{order.birthYear}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{order.clubName}</td>
                      <td className="px-6 py-4 text-gray-300">{order.customerPhone}</td>
                      <td className="px-6 py-4 text-white font-medium">{formatPrice(order.totalPrice)}</td>
                      <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{formatDate(order.createdAt)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openOrder(order)}
                          className="text-amber-400 hover:text-amber-300 text-sm font-medium"
                        >
                          Detay
                        </button>
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

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold text-white">Sipariş Detayı</h2>
              <button
                onClick={() => openOrder(null)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {!editForm && isPaid(selectedOrder) && (
                <ListMatchWarning
                  listMatch={selectedOrder.listMatch}
                  unmatchedApparatuses={selectedOrder.unmatchedApparatuses}
                />
              )}

              {/* Order Info — düzenleme modunda form */}
              {editForm ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([
                    ['athleteName', 'Sporcu Adı'],
                    ['clubName', 'Kulüp'],
                    ['birthYear', 'Doğum Yılı'],
                    ['customerPhone', 'Telefon'],
                    ['customerEmail', 'E-posta'],
                  ] as const).map(([key, label]) => (
                    <label key={key} className={key === 'customerEmail' ? 'sm:col-span-2' : ''}>
                      <span className="block text-xs text-gray-400 mb-1">{label}</span>
                      <input
                        value={editForm[key]}
                        onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                        className={inputClass}
                      />
                    </label>
                  ))}
                  <p className="sm:col-span-2 text-xs text-gray-500 -mt-1">
                    E-posta değişirse sipariş o e-postanın hesabına taşınır.
                  </p>
                  <label className="sm:col-span-2">
                    <span className="block text-xs text-gray-400 mb-1">Not</span>
                    <textarea
                      rows={2}
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      className={`${inputClass} resize-y`}
                    />
                  </label>
                </div>
              ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <p className="text-gray-400 text-sm">Sipariş ID</p>
                  <p className="text-white font-mono text-xs sm:text-sm break-all">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Durum</p>
                  <div className="mt-1"><StatusBadge status={selectedOrder.status} /></div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Sporcu Adı</p>
                  <p className="text-white">{selectedOrder.athleteName}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Doğum Yılı</p>
                  <p className="text-white">{selectedOrder.birthYear}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Kulüp</p>
                  <p className="text-white">{selectedOrder.clubName}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Telefon</p>
                  <p className="text-white">{selectedOrder.customerPhone}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-gray-400 text-sm">Tarih</p>
                  <p className="text-white">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                {selectedOrder.customerEmail && (
                  <div className="sm:col-span-2">
                    <p className="text-gray-400 text-sm">E-posta</p>
                    <p className="text-white break-all">{selectedOrder.customerEmail}</p>
                  </div>
                )}
                {selectedOrder.notes && (
                  <div className="sm:col-span-2">
                    <p className="text-gray-400 text-sm">Notlar</p>
                    <p className="text-white">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Sipariş Kalemleri</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gray-900/50 rounded-lg p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium truncate">{item.packageName}<PriorityBadge show={item.priority} /></p>
                        <p className="text-gray-400 text-xs sm:text-sm">
                          {getCategoryLabel(item.category)} • {item.seriesCount} Seri x {item.quantity} Adet
                        </p>
                        {editForm ? (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {APPARATUSES.map((a) => {
                              const picked = (editApparatuses[item.id] ?? []).includes(a.slug);
                              return (
                                <button
                                  key={a.slug}
                                  type="button"
                                  onClick={() => toggleApparatus(item.id, a.slug, item.seriesCount)}
                                  className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                                    picked
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                      : 'bg-gray-800 text-gray-400 border-gray-600 hover:text-white'
                                  }`}
                                >
                                  {a.label}
                                </button>
                              );
                            })}
                            <span className="text-[11px] text-gray-500 self-center ml-1">
                              {(editApparatuses[item.id] ?? []).length}/{item.seriesCount}
                            </span>
                          </div>
                        ) : item.apparatuses && item.apparatuses.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {item.apparatuses.map((slug) => (
                              <span
                                key={slug}
                                className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
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
                  subtotal={selectedOrder.subtotal}
                  discountPercent={selectedOrder.discountPercent}
                  discountAmount={selectedOrder.discountAmount}
                  formatPrice={formatPrice}
                />
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
                  <span className="text-lg font-medium text-white">Toplam</span>
                  <span className="text-xl font-bold text-amber-400">
                    {formatPrice(selectedOrder.totalPrice)}
                  </span>
                </div>
              </div>

              {/* Düzenle / Sil */}
              {editError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {editError}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-700">
                {editForm ? (
                  <>
                    <button
                      onClick={saveEdit}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Kaydet
                    </button>
                    <button
                      onClick={() => setEditForm(null)}
                      disabled={isSaving}
                      className="px-4 py-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300 text-sm"
                    >
                      Vazgeç
                    </button>
                    <span className="text-xs text-gray-500">
                      Paket, seri ve adet değiştirilemez (tutar iyzico'dan tahsil edildi).
                    </span>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(selectedOrder)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-sm font-medium"
                    >
                      <Pencil className="w-4 h-4" />
                      Düzenle
                    </button>
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Sil
                    </button>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-700">
                <span className="text-gray-400 text-sm mr-2 self-center">Durumu değiştir:</span>
                {['PENDING', 'PAID', 'DELIVERED', 'CANCELLED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => updateOrderStatus(selectedOrder.id, status)}
                    disabled={selectedOrder.status === status}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      status === 'PAID'
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : status === 'DELIVERED'
                        ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                        : status === 'CANCELLED'
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                    }`}
                  >
                    {status === 'PENDING'
                      ? 'Bekliyor'
                      : status === 'PAID'
                      ? 'Ödendi'
                      : status === 'DELIVERED'
                      ? 'Teslim Edildi'
                      : 'İptal'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={confirmDelete && !!selectedOrder}
        title="Sipariş silinsin mi?"
        message={
          selectedOrder && (
            <>
              <strong>{selectedOrder.athleteName}</strong> adına {formatPrice(selectedOrder.totalPrice)} tutarlı
              sipariş kalıcı olarak silinecek ve çekim listesinden düşecek. iyzico'daki ödeme iade
              edilmez; iade gerekiyorsa iyzico panelinden ayrıca yapın.
            </>
          )
        }
        isDeleting={isDeleting}
        onConfirm={deleteOrder}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
};

export default OrdersPage;
