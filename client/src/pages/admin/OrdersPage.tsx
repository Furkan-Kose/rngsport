import { useState, useEffect, useCallback } from 'react';
import { CheckSquare, ClipboardList, Eye, FileSpreadsheet, Pencil, Save, ShoppingCart, Trash2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../lib/api';
import DiscountLine from '../../components/admin/DiscountLine';
import StatusBadge from '../../lib/orderStatus';
import { APPARATUSES, getApparatusLabel } from '../../constants/apparatuses';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import { useRecordsLiveRefresh } from '../../hooks/useRecordsLiveRefresh';
import { useUrlState } from '../../hooks/useUrlState';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import BulkStatusBar from '../../components/admin/BulkStatusBar';
import ExportModal from '../../components/admin/ExportModal';
import PhoneLinks from '../../components/admin/PhoneLinks';
import { ListMatchLegend, ListMatchWarning } from '../../components/admin/ShootingListMatch';
import { listMatchTint, type ListMatchFields } from '../../lib/listMatch';

import PriorityBadge from '../../components/PriorityBadge';
import DeliveryPanel, { DeliveryIcons } from '../../components/admin/DeliveryPanel';
import type { Deliveries } from '../../lib/delivery';
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
  { key: 'PAID', label: 'Ödendi' },
  { key: 'DELIVERED', label: 'Teslim Edildi' },
  { key: 'FAILED', label: 'Başarısız' },
  { key: 'CANCELLED', label: 'İptal' },
] as const;

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
  deliveries?: Deliveries;
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
  // Sekme, arama, sayfa, sıralama ve açık detay adres çubuğunda (yenileme / geri tuşu / link paylaşımı)
  const [url, setUrl] = useUrlState({ status: 'all', q: '', page: '1', sort: '', dir: 'desc', id: '', limit: String(ITEMS_PER_PAGE) });
  const pageSize = [10, 25, 50, 100].includes(Number(url.limit)) ? Number(url.limit) : ITEMS_PER_PAGE;
  // Toplu işlem: Seç → işaretle → durum
  const bulk = useBulkSelection();
  const { selectMode, selectedIds } = bulk;
  const filterStatus = url.status;
  const setFilterStatus = (status: string) => setUrl({ status, page: '1' });
  const [exportOpen, setExportOpen] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const searchQuery = url.q;
  const [searchInput, setSearchInput] = useState(url.q);
  // Detay penceresinde düzenleme: müşteri bilgileri + kalem başına aletler.
  // Paket/seri/adet düzenlenmez — online siparişte tutar iyzico'dan tahsil edildi.
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editApparatuses, setEditApparatuses] = useState<Record<string, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState('');
  // Silinecek sipariş: detaydan da, listedeki satırdan da açılır
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // silent: arka plan yenilemesi (canlı akış) — yükleniyor göstergesi çıkmaz
  const fetchOrders = useCallback(async (page: number = 1, silent = false) => {
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

      const { data } = await api.get(`/api/orders?${params}`);
      setOrders(data.data);
      setPagination(data.pagination);
      setCounts(data.counts ?? {});
    } catch (error) {
      console.error('Orders fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, searchQuery, url.sort, url.dir, pageSize]);

  useEffect(() => {
    fetchOrders(Math.max(1, Number(url.page) || 1));
  }, [fetchOrders, url.page]);

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
    if (!url.id || selectedOrder?.id === url.id) return;
    const inList = orders.find((r) => r.id === url.id);
    if (inList) {
      setSelectedOrder(inList);
      return;
    }
    let cancelled = false;
    api
      .get('/api/orders', { params: { id: url.id, limit: 1 } })
      .then(({ data }) => {
        if (cancelled) return;
        if (data.data?.[0]) setSelectedOrder(data.data[0]);
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
  }, [url.id, orders]);

  const handleSort = (sort: string, dir: 'asc' | 'desc' | null) =>
    setUrl(dir ? { sort, dir, page: '1' } : { sort: '', dir: 'desc', page: '1' });

  // Başka bir admin sipariş düzenlerse / yeni sipariş ödenirse liste kendiliğinden yenilenir.
  // Detay penceresi açıkken bekler (yazılanlar kaybolmasın).
  useRecordsLiveRefresh(() => fetchOrders(pagination.page, true), !!selectedOrder || !!deleteTarget || selectMode);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setUrl({ page: String(newPage) });
    }
  };

  // Teslimat bölümünden gelen durum + teslimat tarihleri
  const applyDelivery = (orderId: string, changes: { status: string; deliveries: Deliveries }) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...changes } : o)));
    setSelectedOrder((prev) => (prev?.id === orderId ? { ...prev, ...changes } : prev));
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
    setUrl({ id: order?.id ?? '' });
    setEditForm(null);
    setEditError('');
    setDeleteTarget(null);
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
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/orders/${deleteTarget.id}`);
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paket Siparişleri"
        icon={ShoppingCart}
        description="Online ödenen fotoğraf / video paket siparişleri."
        actions={
          <Button icon={FileSpreadsheet} onClick={() => setExportOpen(true)}>
            Excel İndir
          </Button>
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
            <Button size="sm" variant="ghost" icon={X} onClick={bulk.exit}>
              Seçimi bitir
            </Button>
          ) : (
            <Button size="sm" icon={CheckSquare} onClick={() => bulk.setSelectMode(true)} disabled={orders.length === 0}>
              Seç (toplu işlem)
            </Button>
          )}
        </div>
      </Toolbar>

      {selectMode && (
        <div className="flex flex-wrap items-center gap-2 -mt-2">
          <span className="text-sm text-white font-medium">
            {selectedIds.size} seçili
            {selectedIds.size > orders.filter((o) => selectedIds.has(o.id)).length && (
              <span className="text-gray-400 font-normal"> (diğer sayfalardakiler dahil)</span>
            )}
          </span>
          <Button size="sm" variant="ghost" onClick={() => bulk.toggleAll(orders.map((o) => o.id))}>
            Bu sayfadakilerin tümü ({orders.length})
          </Button>
          {selectedIds.size > 0 && (
            <Button size="sm" variant="ghost" onClick={bulk.clear}>
              Temizle
            </Button>
          )}
        </div>
      )}

      {/* Orders Table */}
      <Panel className="overflow-hidden">
        {isLoading ? (
          <SkeletonRows />
        ) : orders.length === 0 ? (
          <EmptyState bare icon={ClipboardList} title="Sipariş bulunamadı" description={searchQuery || filterStatus !== 'all' ? 'Arama veya filtreyi değiştirmeyi deneyin.' : undefined} />
        ) : (
          <>
            {/* Çekim listesi eşleşme açıklaması (yalnızca ödenmiş siparişlerde) */}
            <ListMatchLegend scope="ödenen siparişler" />

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-700/50">
              {orders.map((order) => (
                <div key={order.id} className={`p-4 ${getRowTint(order)} ${selectedIds.has(order.id) ? 'bg-amber-500/10' : ''}`}>
                  <div className="flex items-start gap-3">
                  {selectMode && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(order.id)}
                      onChange={() => bulk.toggle(order.id)}
                      className="mt-1 w-5 h-5 accent-amber-500 shrink-0"
                      aria-label={`${order.athleteName} seç`}
                    />
                  )}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => (selectMode ? bulk.toggle(order.id) : openOrder(order))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (selectMode) bulk.toggle(order.id);
                        else openOrder(order);
                      }
                    }}
                    className="flex-1 min-w-0 text-left cursor-pointer"
                  >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">{order.athleteName}</p>
                      <p className="text-gray-400 text-xs truncate">
                        {order.clubName} {order.birthYear ? `• ${order.birthYear}` : ''}
                      </p>
                      <PhoneLinks phone={order.customerPhone} className="mt-1 text-xs" />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-white font-semibold">{formatPrice(order.totalPrice)}</p>
                      <div className="mt-1.5 flex items-center justify-end gap-1.5"><DeliveryIcons deliveries={order.deliveries} /><StatusBadge status={order.status} /></div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs mt-2">{formatDate(order.createdAt)}</p>
                  </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <Button size="sm" icon={Eye} onClick={() => openOrder(order)}>
                      Detay
                    </Button>
                    <Button
                      size="sm"
                      icon={Pencil}
                      onClick={() => {
                        openOrder(order);
                        startEdit(order);
                      }}
                    >
                      Düzenle
                    </Button>
                    <Button size="sm" variant="danger" icon={Trash2} onClick={() => setDeleteTarget(order)}>
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
                          checked={orders.length > 0 && orders.every((o) => selectedIds.has(o.id))}
                          onChange={() => bulk.toggleAll(orders.map((o) => o.id))}
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
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={selectMode ? () => bulk.toggle(order.id) : undefined}
                      className={`hover:bg-gray-700/20 transition-colors ${getRowTint(order)} ${selectMode ? 'cursor-pointer' : ''} ${
                        selectedIds.has(order.id) ? 'bg-amber-500/10' : ''
                      }`}
                    >
                      {selectMode && (
                        <td className="pl-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(order.id)}
                            onChange={() => bulk.toggle(order.id)}
                            className="w-4 h-4 accent-amber-500"
                            aria-label={`${order.athleteName} seç`}
                          />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white font-medium">{order.athleteName}</p>
                          <p className="text-gray-400 text-xs">{order.birthYear}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{order.clubName}</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <PhoneLinks phone={order.customerPhone} />
                      </td>
                      <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{formatPrice(order.totalPrice)}</td>
                      <td className="px-4 py-3"><div className="flex items-center gap-1.5"><StatusBadge status={order.status} /><DeliveryIcons deliveries={order.deliveries} /></div></td>
                      <td className="px-4 py-3 text-gray-400 text-sm whitespace-nowrap">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <IconButton icon={Eye} title="Detay" onClick={() => openOrder(order)} />
                          <IconButton
                            icon={Pencil}
                            title="Düzenle"
                            onClick={() => {
                              openOrder(order);
                              startEdit(order);
                            }}
                          />
                          <IconButton icon={Trash2} title="Sil" tone="danger" onClick={() => setDeleteTarget(order)} />
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

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold text-white">Paket Siparişi Detayı</h2>
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
                  <PhoneLinks phone={selectedOrder.customerPhone} />
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
                    <Button variant="primary" icon={Save} loading={isSaving} onClick={saveEdit}>
                      Kaydet
                    </Button>
                    <Button onClick={() => setEditForm(null)} disabled={isSaving}>
                      Vazgeç
                    </Button>
                    <span className="text-xs text-gray-500">
                      Paket, seri ve adet değiştirilemez (tutar iyzico'dan tahsil edildi).
                    </span>
                  </>
                ) : (
                  <>
                    <Button icon={Pencil} onClick={() => startEdit(selectedOrder)}>
                      Düzenle
                    </Button>
                    <Button variant="danger" icon={Trash2} onClick={() => setDeleteTarget(selectedOrder)}>
                      Sil
                    </Button>
                  </>
                )}
              </div>

              {!editForm && (
                <DeliveryPanel
                  kind="orders"
                  record={selectedOrder}
                  onUpdated={(changes) => applyDelivery(selectedOrder.id, changes)}
                />
              )}

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
        open={!!deleteTarget}
        title="Paket siparişi silinsin mi?"
        message={
          deleteTarget && (
            <>
              <strong>{deleteTarget.athleteName}</strong> adına {formatPrice(deleteTarget.totalPrice)} tutarlı
              sipariş kalıcı olarak silinecek ve çekim listesinden düşecek. iyzico'daki ödeme iade
              edilmez; iade gerekiyorsa iyzico panelinden ayrıca yapın.
            </>
          )
        }
        isDeleting={isDeleting}
        onConfirm={deleteOrder}
        onCancel={() => setDeleteTarget(null)}
      />
      {selectMode && (
        <BulkStatusBar
          kind="order"
          selectedIds={selectedIds}
          names={orders.filter((o) => selectedIds.has(o.id)).map((o) => o.athleteName)}
          onDone={() => {
            bulk.exit();
            fetchOrders(pagination.page, true);
          }}
        />
      )}

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Paket Siparişleri — Excel"
        columnsUrl="/api/orders/export/columns"
        exportUrl="/api/orders/export"
        storageKey="orders"
        fallbackFileName="paket-siparisleri.xlsx"
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

export default OrdersPage;
