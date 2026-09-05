import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import { getApparatusLabel } from '../../constants/apparatuses';

interface OrderItem {
  packageId: string;
  packageName: string;
  category: string;
  price: number;
  seriesCount: number;
  quantity: number;
  apparatuses: string[];
}

interface Order {
  id: string;
  athleteName: string;
  clubName: string;
  birthYear: string;
  customerPhone: string;
  notes: string | null;
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
      PAID: 'bg-green-500/20 text-green-400 border-green-500/30',
      FAILED: 'bg-red-500/20 text-red-400 border-red-500/30',
      CANCELLED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      DELIVERED: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    };
    const labels: Record<string, string> = {
      PENDING: 'Bekliyor',
      PAID: 'Ödendi',
      FAILED: 'Başarısız',
      CANCELLED: 'İptal',
      DELIVERED: 'Teslim Edildi',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${badges[status] || badges.PENDING}`}>
        {labels[status] || status}
      </span>
    );
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
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-700/50">
              {orders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedOrder(order)}
                  className="w-full text-left p-4 hover:bg-gray-700/20 transition-colors"
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
                      <div className="mt-1.5">{getStatusBadge(order.status)}</div>
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
                    <tr key={order.id} className="hover:bg-gray-700/20 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{order.athleteName}</p>
                          <p className="text-gray-400 text-xs">{order.birthYear}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{order.clubName}</td>
                      <td className="px-6 py-4 text-gray-300">{order.customerPhone}</td>
                      <td className="px-6 py-4 text-white font-medium">{formatPrice(order.totalPrice)}</td>
                      <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{formatDate(order.createdAt)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedOrder(order)}
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
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <p className="text-gray-400 text-sm">Sipariş ID</p>
                  <p className="text-white font-mono text-xs sm:text-sm break-all">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Durum</p>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
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
                {selectedOrder.notes && (
                  <div className="sm:col-span-2">
                    <p className="text-gray-400 text-sm">Notlar</p>
                    <p className="text-white">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>

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
                        <p className="text-white font-medium truncate">{item.packageName}</p>
                        <p className="text-gray-400 text-xs sm:text-sm">
                          {getCategoryLabel(item.category)} • {item.seriesCount} Seri x {item.quantity} Adet
                        </p>
                        {item.apparatuses && item.apparatuses.length > 0 && (
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
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
                  <span className="text-lg font-medium text-white">Toplam</span>
                  <span className="text-xl font-bold text-amber-400">
                    {formatPrice(selectedOrder.totalPrice)}
                  </span>
                </div>
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
    </div>
  );
};

export default OrdersPage;
