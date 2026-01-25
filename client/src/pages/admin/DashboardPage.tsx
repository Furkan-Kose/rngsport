import { useState, useEffect } from 'react';
import api from '../../lib/api';

interface Order {
  id: string;
  athleteName: string;
  clubName: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

interface Reservation {
  id: string;
  athleteName: string;
  clubName: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

interface Stats {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  // Rezervasyon stats
  totalReservations: number;
  confirmedReservations: number;
  pendingReservations: number;
  reservationRevenue: number;
}

const DashboardPage = () => {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    paidOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalReservations: 0,
    confirmedReservations: 0,
    pendingReservations: 0,
    reservationRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [orderStatsRes, reservationStatsRes] = await Promise.all([
        api.get('/api/orders/stats'),
        api.get('/api/reservations/stats'),
      ]);
      
      const orderStats = orderStatsRes.data;
      const reservationStats = reservationStatsRes.data;

      setStats({ 
        totalOrders: orderStats.total,
        paidOrders: orderStats.paid,
        pendingOrders: orderStats.pending,
        totalRevenue: orderStats.revenue,
        totalReservations: reservationStats.total,
        confirmedReservations: reservationStats.confirmed + reservationStats.paid,
        pendingReservations: reservationStats.pending,
        reservationRevenue: reservationStats.revenue,
      });
      setRecentOrders(orderStats.recentOrders);
      setRecentReservations(reservationStats.recentReservations);
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
    } finally {
      setIsLoading(false);
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
      CONFIRMED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
    const labels: Record<string, string> = {
      PENDING: 'Bekliyor',
      PAID: 'Ödendi',
      FAILED: 'Başarısız',
      CANCELLED: 'İptal',
      CONFIRMED: 'Onaylandı',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${badges[status] || badges.PENDING}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Hoş geldiniz! İşte genel bakış.</p>
      </div>

      {/* Sipariş Stats */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Online Siparişler
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Toplam Sipariş</p>
                <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Ödenen</p>
                <p className="text-2xl font-bold text-white">{stats.paidOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Bekleyen</p>
                <p className="text-2xl font-bold text-white">{stats.pendingOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/20 rounded-lg">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Toplam Gelir</p>
                <p className="text-2xl font-bold text-white">{formatPrice(stats.totalRevenue)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rezervasyon Stats */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Rezervasyonlar (Nakit)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 border border-violet-700/50 rounded-xl p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-violet-500/20 rounded-lg">
                <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Toplam Rezervasyon</p>
                <p className="text-2xl font-bold text-white">{stats.totalReservations}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-violet-700/50 rounded-xl p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Onaylanan</p>
                <p className="text-2xl font-bold text-white">{stats.confirmedReservations}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-violet-700/50 rounded-xl p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Bekleyen</p>
                <p className="text-2xl font-bold text-white">{stats.pendingReservations}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-violet-700/50 rounded-xl p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Nakit Gelir</p>
                <p className="text-2xl font-bold text-white">{formatPrice(stats.reservationRevenue)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tables Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Son Siparişler
          </h2>
          
          {recentOrders.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Henüz sipariş yok.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                    <th className="pb-3 font-medium">Sporcu</th>
                    <th className="pb-3 font-medium">Tutar</th>
                    <th className="pb-3 font-medium">Durum</th>
                    <th className="pb-3 font-medium">Tarih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="text-sm">
                      <td className="py-3">
                        <div className="text-white font-medium">{order.athleteName}</div>
                        <div className="text-xs text-gray-500">{order.clubName}</div>
                      </td>
                      <td className="py-3 text-gray-300">{formatPrice(order.totalPrice)}</td>
                      <td className="py-3">{getStatusBadge(order.status)}</td>
                      <td className="py-3 text-gray-400 text-xs">{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Reservations */}
        <div className="bg-gray-800/50 border border-violet-700/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Son Rezervasyonlar
          </h2>
          
          {recentReservations.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Henüz rezervasyon yok.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                    <th className="pb-3 font-medium">Sporcu</th>
                    <th className="pb-3 font-medium">Tutar</th>
                    <th className="pb-3 font-medium">Durum</th>
                    <th className="pb-3 font-medium">Tarih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {recentReservations.map((reservation) => (
                    <tr key={reservation.id} className="text-sm">
                      <td className="py-3">
                        <div className="text-white font-medium">{reservation.athleteName}</div>
                        <div className="text-xs text-gray-500">{reservation.clubName}</div>
                      </td>
                      <td className="py-3 text-gray-300">{formatPrice(reservation.totalPrice)}</td>
                      <td className="py-3">{getStatusBadge(reservation.status)}</td>
                      <td className="py-3 text-gray-400 text-xs">{formatDate(reservation.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
