import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { LayoutDashboard, Star } from 'lucide-react';
import api from '../../lib/api';
import StatusBadge from '../../lib/orderStatus';
import { STATUS_BADGE_CLASSES, STATUS_LABELS } from '../../lib/orderStatusMeta';
import ShopStatusBadge from '../../components/admin/ShopStatusBadge';
import { SHOP_STATUS_CLASSES, SHOP_STATUS_LABELS, type ShopStatus } from '../../lib/shop';
import {
  ErrorState,
  PageHeader,
  Panel,
  SectionTabs,
  SkeletonCards,
  SkeletonRows,
} from '../../components/admin/ui';
import { cx, panelClass, rowClickClass, tableBodyClass, tableHeadRowClass, tdClass, thClass } from '../../lib/adminUi';
import { formatCount, formatDateTime, formatMoney } from '../../lib/adminFormat';
import { useAdminTournament } from '../../hooks/useAdminTournament';
import TournamentSelect from '../../components/admin/TournamentSelect';

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
  failed?: number;
  awaitingDelivery?: number;
  /** Durum → sayı */
  statusCounts?: Record<string, number>;
  revenue: number;
  recentOrders: RecentRecord[];
}

interface ReservationStats {
  total: number;
  pending: number;
  confirmed: number;
  paid: number;
  awaitingDelivery?: number;
  /** Durum → sayı */
  statusCounts?: Record<string, number>;
  revenue?: number;
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
  /** Puan (1-5) → sayı */
  ratingCounts?: Record<string, number>;
  recent: {
    id: string;
    rating: number | null;
    message: string;
    isRead: boolean;
    createdAt: string;
    user: { name: string | null; email: string | null } | null;
  }[];
}

interface TournamentSummary {
  packages: {
    slug: string;
    name: string;
    reservations: number;
    orders: number;
    series: number;
    priority: number;
    amount: number;
  }[];
  apparatuses: { slug: string; label: string; count: number }[];
  clubs: { name: string; count: number }[];
  clubCount: number;
  discountTotal?: number;
  discountedRecords?: number;
  records: number;
}

interface CustomerStats {
  total: number;
  withPhotos: number;
  galleryDownloaded?: number;
  galleryNotDownloaded?: number;
  galleryUnclaimed?: number;
}

/** Bir yüklemenin sonucu; `key` hangi yarışma için yüklendiğini söyler */
interface Loaded {
  key: string;
  orders: OrderStats | null;
  reservations: ReservationStats | null;
  shop: ShopStats | null;
  feedback: FeedbackSummary | null;
  summary: TournamentSummary | null;
  customers: CustomerStats | null;
}

/* ------------------------------------------------------------------ */
/* Parçalar                                                           */
/* ------------------------------------------------------------------ */

/**
 * Bir satış kanalının kart satırı: başlık ("Tümünü gör" ile) ve altında tek satır kart.
 * Üç kanal da aynı kalıpta: Toplam → Durumlar → para kartları.
 */
const StatGroup = ({
  title,
  note,
  to,
  short,
  failed,
  onRetry,
  children,
}: {
  title: string;
  /** Başlığın yanındaki kapsam notu (yarışma adı / "tüm zamanlar") */
  note?: ReactNode;
  to: string;
  /** Satır tüm genişliği doldurmuyor (2 + 4 + 2): başlık da kartların bittiği hizada biter */
  short?: boolean;
  failed?: boolean;
  onRetry: () => void;
  children: ReactNode;
}) => (
  <section>
    {/* Kartlarla aynı ızgara: kısa satırda "Tümünü gör" son kartın sağ kenarına hizalanır */}
    <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-3 sm:gap-x-4 mb-3">
      <div className={cx('col-span-2 flex items-baseline justify-between gap-3', short ? 'lg:col-span-8' : 'lg:col-span-12')}>
        <h2 className="min-w-0 truncate">
          <span className="text-base font-semibold text-white">{title}</span>
          {note && <span className="ml-2 text-sm text-gray-400">{note}</span>}
        </h2>
        <Link to={to} className="text-sm font-medium text-amber-400 hover:text-amber-300 whitespace-nowrap">
          Tümünü gör
        </Link>
      </div>
    </div>
    {failed ? (
      <Panel>
        <ErrorState bare title="Bu bölüm yüklenemedi" onRetry={onRetry} />
      </Panel>
    ) : (
      <div className="grid grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4">{children}</div>
    )}
  </section>
);

/** Sade kart: küçük etiket, büyük rakam, tek satır açıklama */
const Tile = ({
  label,
  value,
  hint,
  to,
  children,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  /** Verilirse kartın tamamı bağlantı olur */
  to?: string;
  /** Rakamın altına eklenecek küçük içerik (ör. yıldızlar) */
  children?: ReactNode;
  className?: string;
}) => {
  const body = (
    <>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white truncate">{value}</p>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400 truncate">{hint}</p>}
    </>
  );
  return to ? (
    <Link to={to} className={cx(panelClass, 'block p-4 transition-colors hover:bg-gray-700/40', className)}>
      {body}
    </Link>
  ) : (
    <div className={cx(panelClass, 'p-4', className)}>{body}</div>
  );
};

/** Etiket + ince çubuk + sayı (puan dağılımı, aletler, kulüpler aynı görünümde) */
const BarRow = ({
  label,
  count,
  max,
  labelClass = 'w-7',
}: {
  label: ReactNode;
  count: number;
  max: number;
  labelClass?: string;
}) => (
  <div className="flex items-center gap-2 text-xs text-gray-400">
    <span className={cx('inline-flex items-center gap-0.5 shrink-0 truncate', labelClass)}>{label}</span>
    <span className="flex-1 h-1.5 rounded-full bg-gray-700 overflow-hidden">
      <span className="block h-full rounded-full bg-amber-400" style={{ width: `${(count / Math.max(1, max)) * 100}%` }} />
    </span>
    <span className={cx('w-8 shrink-0 text-right font-medium', count > 0 ? 'text-white' : 'text-gray-400')}>
      {formatCount(count)}
    </span>
  </div>
);

/** Puan dağılımı: 5'ten 1'e her yıldız için ince çubuk + sayı */
const RatingTile = ({ counts, className }: { counts: Record<string, number>; className?: string }) => {
  const max = Math.max(...[1, 2, 3, 4, 5].map((n) => counts[n] ?? 0));
  return (
    <div className={cx(panelClass, 'p-4', className)}>
      <p className="text-sm text-gray-400">Puan dağılımı</p>
      <div className="mt-2.5 space-y-1.5">
        {[5, 4, 3, 2, 1].map((n) => (
          <BarRow
            key={n}
            count={counts[n] ?? 0}
            max={max}
            label={
              <>
                {n}
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              </>
            }
          />
        ))}
      </div>
    </div>
  );
};

/** Çubuk listesi kartı (Aletler, Kulüpler) */
const BarListTile = ({
  title,
  rows,
  empty,
  footer,
  labelClass,
}: {
  title: string;
  rows: { key: string; label: string; count: number }[];
  empty: string;
  footer?: string;
  labelClass: string;
}) => {
  const max = Math.max(0, ...rows.map((row) => row.count));
  return (
    <div className={cx(panelClass, 'p-4')}>
      <p className="text-sm text-gray-400">{title}</p>
      {max === 0 ? (
        <p className="mt-2.5 text-sm text-gray-400">{empty}</p>
      ) : (
        <div className="mt-2.5 space-y-1.5">
          {rows.map((row) => (
            <BarRow key={row.key} label={row.label} count={row.count} max={max} labelClass={labelClass} />
          ))}
        </div>
      )}
      {footer && max > 0 && <p className="mt-3 text-xs text-gray-400">{footer}</p>}
    </div>
  );
};

/** Paket dağılımı tablosu: paket başına rezervasyon / online sipariş / seri / öncelikli / indirimli tutar */
const PackageTable = ({ packages }: { packages: TournamentSummary['packages'] }) => {
  const num = cx(thClass, 'text-right');
  const cell = cx(tdClass, 'text-right text-gray-200 whitespace-nowrap');
  const sum = (pick: (p: TournamentSummary['packages'][number]) => number) => packages.reduce((a, p) => a + pick(p), 0);
  return (
    <Panel className="overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <p className="text-sm text-gray-400">Paketler</p>
        <p className="mt-0.5 text-xs text-gray-400">
          Onaylanan ve ödenen rezervasyonlar ile ödenmiş online siparişler; bekleyenler sayılmaz. Tutar indirimler düşülmüş hâlidir.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={thClass}>Paket</th>
              <th className={num}>Rezervasyon</th>
              <th className={num}>Online</th>
              <th className={num}>Toplam</th>
              <th className={num}>Seri</th>
              <th className={num}>Öncelikli</th>
              <th className={num}>Tutar</th>
            </tr>
          </thead>
          <tbody className={tableBodyClass}>
            {packages.map((p) => (
              <tr key={p.slug}>
                <td className={cx(tdClass, 'text-white font-medium')}>{p.name}</td>
                <td className={cell}>{formatCount(p.reservations)}</td>
                <td className={cell}>{formatCount(p.orders)}</td>
                <td className={cx(cell, 'font-semibold text-white')}>{formatCount(p.reservations + p.orders)}</td>
                <td className={cell}>{formatCount(p.series)}</td>
                <td className={cell}>{formatCount(p.priority)}</td>
                <td className={cell}>{formatMoney(p.amount)}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className={cx(tdClass, 'text-white')}>Toplam</td>
              <td className={cell}>{formatCount(sum((p) => p.reservations))}</td>
              <td className={cell}>{formatCount(sum((p) => p.orders))}</td>
              <td className={cx(cell, 'text-white')}>{formatCount(sum((p) => p.reservations + p.orders))}</td>
              <td className={cell}>{formatCount(sum((p) => p.series))}</td>
              <td className={cell}>{formatCount(sum((p) => p.priority))}</td>
              <td className={cell}>{formatMoney(sum((p) => p.amount))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Panel>
  );
};

interface StatusItem {
  key: string;
  label: string;
  /** Listelerdeki rozetle aynı renk sınıfları */
  tone: string;
  count: number;
  to: string;
}

/** Bütün durumlar tek kartta: rozet renginde küçük etiket + sayı; tıklayınca filtreli liste */
const StatusTile = ({
  items,
  title = 'Durumlar',
  className,
}: {
  items: StatusItem[];
  title?: string;
  className?: string;
}) => (
  <div className={cx(panelClass, 'p-4', className)}>
    <p className="text-sm text-gray-400">{title}</p>
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Link
          key={item.key}
          to={item.to}
          className={cx(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium whitespace-nowrap transition-opacity hover:opacity-100',
            item.tone,
            item.count === 0 && 'opacity-45',
          )}
        >
          {item.label}
          <span className="font-bold text-white">{formatCount(item.count)}</span>
        </Link>
      ))}
    </div>
  </div>
);

const RESERVATION_STATUSES = ['PENDING', 'CONFIRMED', 'PAID', 'DELIVERED', 'CANCELLED'];
const ORDER_STATUSES = ['PENDING', 'PAID', 'DELIVERED', 'FAILED', 'CANCELLED'];
const SHOP_STATUSES: ShopStatus[] = ['PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'FAILED', 'CANCELLED'];
/** Ürün siparişi durumu → o durumu gösteren liste sekmesi */
const SHOP_TAB: Record<ShopStatus, string> = {
  PENDING: 'unpaid',
  FAILED: 'unpaid',
  CONFIRMED: 'todo',
  IN_PRODUCTION: 'todo',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

const Stars =({ rating }: { rating: number }) => (
  <span className="inline-flex" aria-label={`${rating} yıldız`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} className={`w-3.5 h-3.5 ${n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} />
    ))}
  </span>
);

const EmptyRow = ({ children }: { children: ReactNode }) => (
  <p className="text-gray-400 text-sm text-center py-10">{children}</p>
);

/** Son rezervasyonlar / paket siparişleri — iki liste aynı kalıpta */
const RecordTable = ({
  records,
  empty,
  onOpen,
}: {
  records: RecentRecord[];
  empty: string;
  onOpen: (id: string) => void;
}) =>
  records.length === 0 ? (
    <EmptyRow>{empty}</EmptyRow>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className={tableHeadRowClass}>
            <th className={thClass}>Sporcu</th>
            <th className={thClass}>Tutar</th>
            <th className={thClass}>Durum</th>
            <th className={cx(thClass, 'hidden sm:table-cell')}>Tarih</th>
          </tr>
        </thead>
        <tbody className={tableBodyClass}>
          {records.map((r) => (
            <tr key={r.id} onClick={() => onOpen(r.id)} className={rowClickClass} title="Detayı aç">
              <td className={tdClass}>
                <div className="text-white font-medium">{r.athleteName}</div>
                <div className="text-xs text-gray-400">{r.clubName}</div>
              </td>
              <td className={cx(tdClass, 'text-gray-200 whitespace-nowrap')}>{formatMoney(r.totalPrice)}</td>
              <td className={tdClass}>
                <StatusBadge status={r.status} />
              </td>
              <td className={cx(tdClass, 'hidden sm:table-cell text-gray-400 whitespace-nowrap')}>
                {formatDateTime(r.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

type RecentTab = 'reservations' | 'orders' | 'shop' | 'feedback';

/* ------------------------------------------------------------------ */
/* Sayfa                                                              */
/* ------------------------------------------------------------------ */

/**
 * Ana sayfa:
 *  1. Üç satış kanalı için birer kart satırı (StatGroup), hepsi aynı kalıpta:
 *     Toplam → Durumlar (bütün durumlar tek kartta, rozet renginde, tıklanır) → para kartları.
 *     Kartlar bilerek sade ve nötr; renk yalnızca durum etiketlerinde.
 *  2. Son kayıtlar — tek panel, sekmeli
 * Rezervasyon ve paket siparişi rakamları seçili yarışmaya göredir; ürün siparişleri ve
 * görüşler yarışmadan bağımsızdır (başlıkta yazar).
 */
const DashboardPage = () => {
  const navigate = useNavigate();
  const tournament = useAdminTournament();
  const tq = `?tournamentId=${encodeURIComponent(tournament.param)}`;
  const tLink = tournament.value ? `t=${encodeURIComponent(tournament.value)}` : '';
  const withT = (path: string, query = '') => {
    const qs = [query, tLink].filter(Boolean).join('&');
    return qs ? `${path}?${qs}` : path;
  };

  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [recentTab, setRecentTab] = useState<RecentTab>('reservations');

  useEffect(() => {
    if (!tournament.ready) return;
    let alive = true;
    // allSettled: bir bölümün hatası diğerlerini göstermeye engel olmasın
    Promise.allSettled([
      api.get(`/api/orders/stats${tq}`),
      api.get(`/api/reservations/stats${tq}`),
      api.get('/api/shop/admin/stats'),
      api.get('/api/feedback/summary'),
      api.get(`/api/admin/tournament-summary${tq}`),
      api.get('/api/users/stats'),
    ]).then(([o, r, s, f, d, c]) => {
      if (!alive) return;
      [o, r, s, f, d, c].forEach((res) => {
        if (res.status === 'rejected') console.error('Ana sayfa verisi alınamadı:', res.reason);
      });
      // Başarısız bölüm null olur: önceki yarışmanın rakamı ekranda kalmaz
      setLoaded({
        key: `${tq}#${attempt}`,
        orders: o.status === 'fulfilled' ? o.value.data : null,
        reservations: r.status === 'fulfilled' ? r.value.data : null,
        shop: s.status === 'fulfilled' ? s.value.data : null,
        feedback: f.status === 'fulfilled' ? f.value.data : null,
        summary: d.status === 'fulfilled' ? d.value.data : null,
        customers: c.status === 'fulfilled' ? c.value.data : null,
      });
    });
    return () => {
      alive = false;
    };
  }, [tournament.ready, tq, attempt]);

  // Yarışma değişince (ya da yeniden denenince) eski rakamlar yerine iskelet gösterilir
  const isLoading = !loaded || loaded.key !== `${tq}#${attempt}`;

  const header = (
    <PageHeader
      title="Ana Sayfa"
      icon={LayoutDashboard}
      description="Satışların özeti ve son kayıtlar."
      actions={
        tournament.ready && (
          <TournamentSelect
            tournaments={tournament.tournaments}
            value={tournament.value}
            onChange={tournament.setValue}
            className="w-full sm:w-auto"
          />
        )
      }
    />
  );

  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy="true">
        {header}
        <SkeletonCards />
        <SkeletonCards />
        <SkeletonCards />
        <SkeletonCards />
        <SkeletonCards />
        <Panel className="overflow-hidden">
          <SkeletonRows rows={5} />
        </Panel>
      </div>
    );
  }

  const { orders, reservations, shop, feedback, summary, customers } = loaded;
  const allFailed = !orders && !reservations && !shop && !feedback && !summary && !customers;
  const retry = () => setAttempt((n) => n + 1);

  if (allFailed) {
    return (
      <div className="space-y-6">
        {header}
        <ErrorState title="Ana sayfa verisi yüklenemedi" onRetry={retry} />
      </div>
    );
  }

  const scopeName = tournament.current?.name ?? 'Tüm yarışmalar';

  return (
    <div className="space-y-8">
      {header}

      {/* Rezervasyonlar (stantta ödeme) */}
      <StatGroup
        title="Rezervasyonlar"
        note={scopeName}
        to={withT('/admin/reservations')}
        failed={!reservations}
        onRetry={retry}
      >
        <Tile label="Toplam rezervasyon" value={formatCount(reservations?.total)} className="col-span-2 lg:col-span-2" />
        <StatusTile
          className="col-span-2 lg:col-span-4"
          items={RESERVATION_STATUSES.map((status) => ({
            key: status,
            label: STATUS_LABELS[status],
            tone: STATUS_BADGE_CLASSES[status],
            count: reservations?.statusCounts?.[status] ?? 0,
            to: withT('/admin/reservations', `status=${status}`),
          }))}
        />
        <Tile
          label="Toplam tutar"
          value={formatMoney(reservations?.revenue)}
          hint="Onaylanan + ödenen"
          className="col-span-2 lg:col-span-2"
        />
        <Tile label="Ödenen" value={formatMoney(reservations?.paidRevenue)} hint="Alınan para" className="lg:col-span-2" />
        <Tile
          label="Onaylanan"
          value={formatMoney(reservations?.confirmedRevenue)}
          hint="Alınacak para"
          className="lg:col-span-2"
        />
      </StatGroup>

      {/* Paket siparişleri (online ödeme) */}
      <StatGroup short title="Paket Siparişleri" note={scopeName} to={withT('/admin/orders')} failed={!orders} onRetry={retry}>
        <Tile label="Toplam sipariş" value={formatCount(orders?.total)} className="col-span-2 lg:col-span-2" />
        <StatusTile
          className="col-span-2 lg:col-span-4"
          items={ORDER_STATUSES.map((status) => ({
            key: status,
            label: STATUS_LABELS[status],
            tone: STATUS_BADGE_CLASSES[status],
            count: orders?.statusCounts?.[status] ?? 0,
            to: withT('/admin/orders', `status=${status}`),
          }))}
        />
        <Tile label="Gelir" value={formatMoney(orders?.revenue)} hint="Online ödenen" className="col-span-2 lg:col-span-2" />
      </StatGroup>

      {/* Ürün siparişleri — yarışmadan bağımsız */}
      <StatGroup short title="Ürün Siparişleri" note="Tüm zamanlar" to="/admin/shop/orders" failed={!shop} onRetry={retry}>
        <Tile
          label="Toplam sipariş"
          value={formatCount(shop ? Object.values(shop.counts).reduce((a, b) => a + b, 0) : undefined)}
          className="col-span-2 lg:col-span-2"
        />
        <StatusTile
          className="col-span-2 lg:col-span-4"
          items={SHOP_STATUSES.map((status) => ({
            key: status,
            label: SHOP_STATUS_LABELS[status],
            tone: SHOP_STATUS_CLASSES[status],
            count: shop?.counts[status] ?? 0,
            to: `/admin/shop/orders?tab=${SHOP_TAB[status]}`,
          }))}
        />
        <Tile label="Gelir" value={formatMoney(shop?.paidRevenue)} hint="Ödenen siparişler" className="col-span-2 lg:col-span-2" />
      </StatGroup>

      {/* Görüşler — yarışmadan bağımsız */}
      <StatGroup short title="Görüşler" note="Tüm zamanlar" to="/admin/feedback" failed={!feedback} onRetry={retry}>
        <Tile label="Toplam görüş" value={formatCount(feedback?.total)} className="col-span-2 lg:col-span-2" />
        <RatingTile counts={feedback?.ratingCounts ?? {}} className="col-span-2 lg:col-span-4" />
        <Tile
          label="Ortalama puan"
          value={
            feedback?.averageRating != null
              ? `${feedback.averageRating.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} / 5`
              : '—'
          }
          hint={`${formatCount(feedback?.ratedCount)} değerlendirme`}
          className="col-span-2 lg:col-span-2"
        >
          {feedback?.averageRating != null && (
            <span className="mt-1 block">
              <Stars rating={Math.round(feedback.averageRating)} />
            </span>
          )}
        </Tile>
      </StatGroup>

      {/* Galeri — yarışmadan bağımsız (albümler yarışmaya bağlı değil) */}
      <StatGroup short title="Galeri" note="Tüm zamanlar" to="/admin/users?gallery=with" failed={!customers} onRetry={retry}>
        <Tile
          label="Galerisi olan müşteri"
          value={formatCount(customers?.withPhotos)}
          className="col-span-2 lg:col-span-2"
        />
        <StatusTile
          title="İndirme durumu"
          className="col-span-2 lg:col-span-4"
          items={[
            {
              key: 'downloaded',
              label: 'İndirdi',
              tone: STATUS_BADGE_CLASSES.PAID,
              count: customers?.galleryDownloaded ?? 0,
              to: '/admin/users?gallery=downloaded',
            },
            {
              key: 'notDownloaded',
              label: 'Henüz indirmedi',
              tone: STATUS_BADGE_CLASSES.PENDING,
              count: customers?.galleryNotDownloaded ?? 0,
              to: '/admin/users?gallery=notDownloaded',
            },
          ]}
        />
        <Tile
          label="Hesabına girmemiş"
          value={formatCount(customers?.galleryUnclaimed)}
          hint="Dosyası var, şifresi yok"
          to="/admin/users?gallery=unclaimed"
          className="col-span-2 lg:col-span-2"
        />
      </StatGroup>

      {/* Son kayıtlar */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3">Son kayıtlar</h2>
        <Panel className="overflow-hidden">
          <div className="px-2 sm:px-4">
            <SectionTabs<RecentTab>
              value={recentTab}
              onChange={setRecentTab}
              tabs={[
                { key: 'reservations', label: 'Rezervasyonlar' },
                { key: 'orders', label: 'Paket siparişleri' },
                { key: 'shop', label: 'Ürün siparişleri' },
                { key: 'feedback', label: 'Görüşler', count: feedback?.unread || undefined },
              ]}
            />
          </div>

          {recentTab === 'reservations' &&
            (reservations ? (
              <RecordTable
                records={reservations.recentReservations}
                empty="Henüz rezervasyon yok."
                onOpen={(id) => navigate(withT('/admin/reservations', `id=${id}`))}
              />
            ) : (
              <ErrorState bare onRetry={retry} />
            ))}

          {recentTab === 'orders' &&
            (orders ? (
              <RecordTable
                records={orders.recentOrders}
                empty="Henüz paket siparişi yok."
                onOpen={(id) => navigate(withT('/admin/orders', `id=${id}`))}
              />
            ) : (
              <ErrorState bare onRetry={retry} />
            ))}

          {recentTab === 'shop' &&
            (shop ? (
              shop.recentOrders.length === 0 ? (
                <EmptyRow>Henüz ödenmiş ürün siparişi yok.</EmptyRow>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={tableHeadRowClass}>
                        <th className={thClass}>Alıcı</th>
                        <th className={thClass}>Tutar</th>
                        <th className={thClass}>Durum</th>
                        <th className={cx(thClass, 'hidden sm:table-cell')}>Tarih</th>
                      </tr>
                    </thead>
                    <tbody className={tableBodyClass}>
                      {shop.recentOrders.map((o) => (
                        <tr
                          key={o.id}
                          onClick={() => navigate(`/admin/shop/orders?tab=all&id=${o.id}`)}
                          className={rowClickClass}
                          title="Detayı aç"
                        >
                          <td className={tdClass}>
                            <div className="text-white font-medium">{o.recipientName}</div>
                            <div className="text-xs text-gray-400">
                              {o.productName}
                              {o.quantity > 1 && ` × ${o.quantity}`} · {o.city}
                            </div>
                          </td>
                          <td className={cx(tdClass, 'text-gray-200 whitespace-nowrap')}>{formatMoney(o.totalPrice)}</td>
                          <td className={tdClass}>
                            <ShopStatusBadge status={o.status} />
                          </td>
                          <td className={cx(tdClass, 'hidden sm:table-cell text-gray-400 whitespace-nowrap')}>
                            {formatDateTime(o.paidAt ?? o.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <ErrorState bare onRetry={retry} />
            ))}

          {recentTab === 'feedback' &&
            (feedback ? (
              feedback.recent.length === 0 ? (
                <EmptyRow>Henüz görüş yok.</EmptyRow>
              ) : (
                <>
                  <ul className="divide-y divide-gray-700/50">
                    {feedback.recent.map((f) => (
                      <li key={f.id}>
                        <Link
                          to={f.isRead ? '/admin/feedback' : '/admin/feedback?tab=unread'}
                          className="flex gap-3 px-4 py-3 hover:bg-gray-700/20 transition-colors"
                        >
                          <span
                            className={cx('mt-2 w-2 h-2 rounded-full shrink-0', f.isRead ? 'bg-transparent' : 'bg-amber-400')}
                            title={f.isRead ? undefined : 'Okunmamış'}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400">
                              <span className="text-white text-sm font-medium">
                                {f.user?.name || f.user?.email || 'Silinmiş hesap'}
                              </span>
                              {f.rating ? <Stars rating={f.rating} /> : null}
                              <span>{formatDateTime(f.createdAt)}</span>
                            </span>
                            <span className="block text-gray-300 text-sm mt-1 line-clamp-2 whitespace-pre-line">
                              {f.message}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )
            ) : (
              <ErrorState bare onRetry={retry} />
            ))}
        </Panel>
      </section>

      {/* Yarışma detayı: paket, alet ve kulüp dağılımı */}
      <section>
        <h2 className="mb-3 min-w-0 truncate">
          <span className="text-base font-semibold text-white">Yarışma detayı</span>
          <span className="ml-2 text-sm text-gray-400">{scopeName}</span>
        </h2>
        {!summary ? (
          <Panel>
            <ErrorState bare title="Bu bölüm yüklenemedi" onRetry={retry} />
          </Panel>
        ) : summary.records === 0 ? (
          <Panel>
            <EmptyRow>Bu yarışma için henüz kayıt yok.</EmptyRow>
          </Panel>
        ) : (
          <div className="grid lg:grid-cols-12 gap-3 sm:gap-4 items-start">
            <div className="lg:col-span-8 min-w-0">
              <PackageTable packages={summary.packages} />
            </div>
            <div className="lg:col-span-4 space-y-3 sm:space-y-4 min-w-0">
              <Tile
                label="Sadakat indirimi"
                value={formatMoney(summary.discountTotal ?? 0)}
                hint={`${formatCount(summary.discountedRecords ?? 0)} kayıtta uygulandı`}
              />
              <BarListTile
                title="Aletler (seri sayısı)"
                rows={summary.apparatuses.map((a) => ({ key: a.slug, label: a.label, count: a.count }))}
                empty="Alet seçilmiş kayıt yok."
                labelClass="w-20"
              />
              <BarListTile
                title="Kulüpler (sporcu sayısı)"
                rows={summary.clubs.map((c) => ({ key: c.name, label: c.name, count: c.count }))}
                empty="Kulüp bilgisi yok."
                footer={
                  summary.clubCount > summary.clubs.length
                    ? `İlk ${summary.clubs.length} kulüp · toplam ${formatCount(summary.clubCount)} kulüp`
                    : `Toplam ${formatCount(summary.clubCount)} kulüp`
                }
                labelClass="w-32"
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
