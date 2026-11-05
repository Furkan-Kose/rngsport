import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Clock,
  LayoutDashboard,
  MessageSquare,
  ShoppingCart,
  Star,
  Truck,
  Wallet,
  Wrench,
} from 'lucide-react';
import api from '../../lib/api';
import StatusBadge from '../../lib/orderStatus';
import ShopStatusBadge from '../../components/admin/ShopStatusBadge';
import type { ShopStatus } from '../../lib/shop';
import {
  SkeletonCards,
  PageHeader,
  Panel,
  PanelHeader,
  SectionTitle,
  StatCard,
} from '../../components/admin/ui';
import { tableBodyClass, tableHeadRowClass } from '../../lib/adminUi';

interface RecentRecord {
  id: string;
  athleteName: string;
  clubName: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

interface OrderStats {
  total: number;
  paid: number;
  pending: number;
  revenue: number;
  recentOrders: RecentRecord[];
}

interface ReservationStats {
  total: number;
  pending: number;
  confirmed: number;
  paid: number;
  confirmedRevenue?: number;
  paidRevenue?: number;
  recentReservations: RecentRecord[];
}

interface ShopStats {
  counts: Record<ShopStatus, number>;
  toProcess: number;
  unpaid: number;
  paid: number;
  paidRevenue: number;
  recentOrders: {
    id: string;
    productName: string;
    quantity: number;
    recipientName: string;
    city: string;
    totalPrice: number;
    status: ShopStatus;
    paidAt: string | null;
    createdAt: string;
  }[];
}

interface FeedbackSummary {
  unread: number;
  total: number;
  averageRating: number | null;
  ratedCount: number;
  recent: {
    id: string;
    rating: number | null;
    message: string;
    isRead: boolean;
    createdAt: string;
    user: { name: string | null; email: string | null } | null;
  }[];
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(price);

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));

const SeeAll = ({ to }: { to: string }) => (
  <Link to={to} className="text-sm text-amber-400 hover:text-amber-300 font-medium whitespace-nowrap">
    Tümünü gör →
  </Link>
);

const Unavailable = () => <p className="text-gray-500 text-sm text-center py-8">Bu bölüm yüklenemedi.</p>;

const RecentTable = ({
  head,
  empty,
  children,
}: {
  head: string[];
  empty: string;
  children: ReactNode[];
}) =>
  children.length === 0 ? (
    <p className="text-gray-400 text-sm text-center py-8">{empty}</p>
  ) : (
    <div className="overflow-x-auto -mx-4 sm:-mx-6">
      <table className="w-full text-sm">
        <thead>
          <tr className={tableHeadRowClass}>
            {head.map((h) => (
              <th key={h} className={`px-4 sm:px-6 pb-3 font-medium ${h === 'Tarih' ? 'hidden sm:table-cell' : ''}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={tableBodyClass}>{children}</tbody>
      </table>
    </div>
  );

const Stars = ({ rating }: { rating: number }) => (
  <span className="inline-flex" aria-label={`${rating} yıldız`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} className={`w-3.5 h-3.5 ${n <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`} />
    ))}
  </span>
);

const DashboardPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderStats | null>(null);
  const [reservations, setReservations] = useState<ReservationStats | null>(null);
  const [shop, setShop] = useState<ShopStats | null>(null);
  const [feedback, setFeedback] = useState<FeedbackSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // allSettled: bir bölümün hatası diğerlerini göstermeye engel olmasın
    Promise.allSettled([
      api.get('/api/orders/stats'),
      api.get('/api/reservations/stats'),
      api.get('/api/shop/admin/stats'),
      api.get('/api/feedback/summary'),
    ]).then(([o, r, s, f]) => {
      if (o.status === 'fulfilled') setOrders(o.value.data);
      if (r.status === 'fulfilled') setReservations(r.value.data);
      if (s.status === 'fulfilled') setShop(s.value.data);
      if (f.status === 'fulfilled') setFeedback(f.value.data);
      [o, r, s, f].forEach((res) => {
        if (res.status === 'rejected') console.error('Dashboard verisi alınamadı:', res.reason);
      });
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <PageHeader title="Dashboard" icon={LayoutDashboard} description="Hoş geldiniz! İşte genel bakış." />
        <SkeletonCards />
        <SkeletonCards />
        <SkeletonCards />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" icon={LayoutDashboard} description="Hoş geldiniz! İşte genel bakış." />

      {/* Paket Siparişleri (online) */}
      <section>
        <SectionTitle
          title="Paket Siparişleri (Online)"
          icon={ShoppingCart}
          iconClassName="text-blue-400"
          action={<SeeAll to="/admin/orders" />}
        />
        {orders ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard reserveHint label="Toplam Sipariş" value={orders.total} icon={ClipboardList} tone="blue" />
            <StatCard reserveHint label="Ödenen" value={orders.paid} hint="teslim edilenler dahil" icon={CheckCircle2} tone="green" />
            <StatCard reserveHint label="Bekleyen" value={orders.pending} icon={Clock} tone="yellow" />
            <StatCard reserveHint label="Toplam Gelir" value={formatPrice(orders.revenue)} icon={CircleDollarSign} tone="amber" />
          </div>
        ) : (
          <Panel>
            <Unavailable />
          </Panel>
        )}
      </section>

      {/* Rezervasyonlar (nakit) */}
      <section>
        <SectionTitle
          title="Rezervasyonlar (Nakit)"
          icon={CalendarDays}
          iconClassName="text-violet-400"
          action={<SeeAll to="/admin/reservations" />}
        />
        {reservations ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard reserveHint label="Toplam Rezervasyon" value={reservations.total} icon={CalendarDays} tone="violet" />
            <StatCard reserveHint label="Bekleyen" value={reservations.pending} icon={Clock} tone="yellow" />
            {/* Onaylandı: para henüz alınmadı */}
            <StatCard
              reserveHint
              label={`Onaylandı · ${reservations.confirmed}`}
              value={formatPrice(reservations.confirmedRevenue ?? 0)}
              hint="tahsil edilecek"
              icon={CheckCircle2}
              tone="blue"
            />
            {/* Ödendi: teslim edilenler dahil */}
            <StatCard
              reserveHint
              label={`Ödendi · ${reservations.paid}`}
              value={formatPrice(reservations.paidRevenue ?? 0)}
              hint="tahsil edildi · teslim edilenler dahil"
              icon={Wallet}
              tone="green"
            />
          </div>
        ) : (
          <Panel>
            <Unavailable />
          </Panel>
        )}
      </section>

      {/* Ürün Siparişleri */}
      <section>
        <SectionTitle
          title="Ürün Siparişleri"
          icon={Truck}
          iconClassName="text-teal-400"
          action={<SeeAll to="/admin/shop/orders" />}
        />
        {shop ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              reserveHint
              label="Hazırlanacak"
              value={shop.toProcess}
              hint="onaylandı + hazırlanıyor"
              icon={Wrench}
              tone="sky"
              to="/admin/shop/orders"
            />
            {/* Sipariş verildi ama ödeme gelmedi (iyzico'da yarım kalan / başarısız) */}
            <StatCard
              reserveHint
              label="Ödeme Bekleyen"
              value={shop.unpaid ?? 0}
              hint="ödeme bekleniyor / başarısız"
              icon={Clock}
              tone="yellow"
              to="/admin/shop/orders?tab=unpaid"
            />
            <StatCard
              reserveHint
              label="Kargoda"
              value={shop.counts.SHIPPED ?? 0}
              hint={`teslim edildi: ${shop.counts.DELIVERED ?? 0}`}
              icon={Truck}
              tone="violet"
            />
            <StatCard
              reserveHint
              label={`Ürün Geliri · ${shop.paid}`}
              value={formatPrice(shop.paidRevenue)}
              icon={CircleDollarSign}
              tone="amber"
            />
          </div>
        ) : (
          <Panel>
            <Unavailable />
          </Panel>
        )}
      </section>

      {/* Son kayıtlar */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Panel padded>
          <PanelHeader
            title="Son Paket Siparişleri"
            icon={ShoppingCart}
            iconClassName="text-blue-400"
            action={<SeeAll to="/admin/orders" />}
          />
          {orders ? (
            <RecentTable head={['Sporcu', 'Tutar', 'Durum', 'Tarih']} empty="Henüz paket siparişi yok.">
              {orders.recentOrders.map((order) => (
                <tr key={order.id} onClick={() => navigate(`/admin/orders?id=${order.id}`)} className="cursor-pointer hover:bg-gray-700/20 transition-colors" title="Detayı aç">
                  <td className="px-4 sm:px-6 py-3">
                    <div className="text-white font-medium">{order.athleteName}</div>
                    <div className="text-xs text-gray-500">{order.clubName}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 text-gray-300 whitespace-nowrap">{formatPrice(order.totalPrice)}</td>
                  <td className="px-4 sm:px-6 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="hidden sm:table-cell px-4 sm:px-6 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(order.createdAt)}</td>
                </tr>
              ))}
            </RecentTable>
          ) : (
            <Unavailable />
          )}
        </Panel>

        <Panel padded>
          <PanelHeader
            title="Son Rezervasyonlar"
            icon={CalendarDays}
            iconClassName="text-violet-400"
            action={<SeeAll to="/admin/reservations" />}
          />
          {reservations ? (
            <RecentTable head={['Sporcu', 'Tutar', 'Durum', 'Tarih']} empty="Henüz rezervasyon yok.">
              {reservations.recentReservations.map((r) => (
                <tr key={r.id} onClick={() => navigate(`/admin/reservations?id=${r.id}`)} className="cursor-pointer hover:bg-gray-700/20 transition-colors" title="Detayı aç">
                  <td className="px-4 sm:px-6 py-3">
                    <div className="text-white font-medium">{r.athleteName}</div>
                    <div className="text-xs text-gray-500">{r.clubName}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 text-gray-300 whitespace-nowrap">{formatPrice(r.totalPrice)}</td>
                  <td className="px-4 sm:px-6 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="hidden sm:table-cell px-4 sm:px-6 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
            </RecentTable>
          ) : (
            <Unavailable />
          )}
        </Panel>

        <Panel padded>
          <PanelHeader
            title="Son Ürün Siparişleri"
            icon={Truck}
            iconClassName="text-teal-400"
            action={<SeeAll to="/admin/shop/orders" />}
          />
          {shop ? (
            <RecentTable head={['Ürün', 'Alıcı', 'Tutar', 'Durum']} empty="Henüz ödenmiş ürün siparişi yok.">
              {shop.recentOrders.map((o) => (
                <tr key={o.id} onClick={() => navigate(`/admin/shop/orders?tab=all&id=${o.id}`)} className="cursor-pointer hover:bg-gray-700/20 transition-colors" title="Detayı aç">
                  <td className="px-4 sm:px-6 py-3">
                    <div className="text-white font-medium">
                      {o.productName}
                      {o.quantity > 1 && <span className="text-gray-400"> × {o.quantity}</span>}
                    </div>
                    <div className="text-xs text-gray-500">{formatDate(o.paidAt ?? o.createdAt)}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <div className="text-gray-200">{o.recipientName}</div>
                    <div className="text-xs text-gray-500">{o.city}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 text-gray-300 whitespace-nowrap">{formatPrice(o.totalPrice)}</td>
                  <td className="px-4 sm:px-6 py-3">
                    <ShopStatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </RecentTable>
          ) : (
            <Unavailable />
          )}
        </Panel>

        <Panel padded>
          <PanelHeader
            title={
              <>
                Son Görüşler
                {feedback && (
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    {feedback.unread > 0 && <span className="text-amber-400">{feedback.unread} okunmamış · </span>}
                    {feedback.averageRating !== null
                      ? `ort. ${feedback.averageRating.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}★`
                      : `${feedback.total} görüş`}
                  </span>
                )}
              </>
            }
            icon={MessageSquare}
            iconClassName="text-amber-400"
            action={<SeeAll to="/admin/feedback" />}
          />
          {feedback ? (
            feedback.recent.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Henüz görüş yok.</p>
            ) : (
              <ul className="divide-y divide-gray-700/50 -my-3">
                {feedback.recent.map((f) => (
                  <li
                    key={f.id}
                    onClick={() => navigate(f.isRead ? '/admin/feedback' : '/admin/feedback?tab=unread')}
                    className="py-3 flex gap-3 cursor-pointer hover:bg-gray-700/20 -mx-2 px-2 rounded-lg transition-colors"
                    title="Görüşlerde aç"
                  >
                    <span
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${f.isRead ? 'bg-transparent' : 'bg-amber-400'}`}
                      title={f.isRead ? undefined : 'Okunmamış'}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                        <span className="text-gray-200 text-sm font-medium">
                          {f.user?.name || f.user?.email || 'Silinmiş hesap'}
                        </span>
                        {f.rating ? <Stars rating={f.rating} /> : null}
                        <span>{formatDate(f.createdAt)}</span>
                      </div>
                      <p className="text-gray-300 text-sm mt-1 line-clamp-2 whitespace-pre-line">{f.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <Unavailable />
          )}
        </Panel>
      </div>
    </div>
  );
};

export default DashboardPage;
