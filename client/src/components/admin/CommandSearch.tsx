import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { CalendarDays, Loader2, Search, ShoppingCart, Truck, User, X } from 'lucide-react';
import api from '../../lib/api';
import StatusBadge from '../../lib/orderStatus';
import ShopStatusBadge from './ShopStatusBadge';
import type { ShopStatus } from '../../lib/shop';

/**
 * Hızlı arama (Ctrl/⌘+K): sporcu, kulüp, telefon ya da e-posta ile paket siparişleri,
 * rezervasyonlar, ürün siparişleri ve müşterilerde aynı anda arar. Sonuç detayı ?id= ile açar.
 */

interface RecordHit {
  id: string;
  athleteName: string;
  clubName: string;
  customerPhone: string;
  totalPrice: number;
  status: string;
}
interface ShopHit {
  id: string;
  productName: string;
  recipientName: string;
  phone: string;
  totalPrice: number;
  status: ShopStatus;
}
interface UserHit {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
}
interface Results {
  orders: RecordHit[];
  reservations: RecordHit[];
  shopOrders: ShopHit[];
  users: UserHit[];
}

interface Item {
  key: string;
  to: string;
  title: string;
  subtitle: string;
  right?: React.ReactNode;
}

const formatPrice = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);

const CommandSearch = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (open) {
      setQ('');
      setResults(null);
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // 250 ms gecikmeli arama; eski isteğin cevabı yenisini ezmesin
  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/api/admin/search', { params: { q: term } });
        if (!cancelled) {
          setResults(data);
          setActive(0);
        }
      } catch {
        if (!cancelled) setResults({ orders: [], reservations: [], shopOrders: [], users: [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q, open]);

  const groups = useMemo(() => {
    if (!results) return [];
    const list: { title: string; icon: typeof Search; items: Item[] }[] = [
      {
        title: 'Paket Siparişleri',
        icon: ShoppingCart,
        items: results.orders.map((o) => ({
          key: `o-${o.id}`,
          to: `/admin/orders?id=${o.id}`,
          title: o.athleteName,
          subtitle: `${o.clubName} · ${o.customerPhone} · ${formatPrice(o.totalPrice)}`,
          right: <StatusBadge status={o.status} />,
        })),
      },
      {
        title: 'Rezervasyonlar',
        icon: CalendarDays,
        items: results.reservations.map((r) => ({
          key: `r-${r.id}`,
          to: `/admin/reservations?id=${r.id}`,
          title: r.athleteName,
          subtitle: `${r.clubName} · ${r.customerPhone} · ${formatPrice(r.totalPrice)}`,
          right: <StatusBadge status={r.status} />,
        })),
      },
      {
        title: 'Ürün Siparişleri',
        icon: Truck,
        items: results.shopOrders.map((s) => ({
          key: `s-${s.id}`,
          to: `/admin/shop/orders?tab=all&id=${s.id}`,
          title: s.recipientName,
          subtitle: `${s.productName} · ${s.phone} · ${formatPrice(s.totalPrice)}`,
          right: <ShopStatusBadge status={s.status} />,
        })),
      },
      {
        title: 'Müşteriler',
        icon: User,
        items: results.users.map((u) => ({
          key: `u-${u.id}`,
          to: `/admin/users/${u.id}`,
          title: u.name || u.email || 'İsimsiz',
          subtitle: [u.email, u.phone].filter(Boolean).join(' · '),
        })),
      },
    ];
    return list.filter((g) => g.items.length > 0);
  }, [results]);

  const flat = groups.flatMap((g) => g.items);

  if (!open) return null;

  const go = (item: Item) => {
    onClose();
    navigate(item.to);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && flat[active]) {
      e.preventDefault();
      go(flat[active]);
    }
  };

  let index = -1;
  return (
    <div className="fixed inset-0 z-[70] bg-black/70 flex items-start justify-center p-3 sm:pt-[12vh]" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Hızlı arama"
      >
        <div className="flex items-center gap-3 px-4 border-b border-gray-700">
          {loading ? (
            <Loader2 className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
          ) : (
            <Search className="w-5 h-5 text-gray-500 shrink-0" />
          )}
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Sporcu, kulüp, telefon veya e-posta ara…"
            className="flex-1 h-14 bg-transparent text-white placeholder-gray-500 focus:outline-none"
            aria-label="Ara"
          />
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-white" aria-label="Kapat">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {q.trim().length < 2 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-500">
              En az 2 harf yazın. Paket siparişleri, rezervasyonlar, ürün siparişleri ve müşterilerde aranır.
            </p>
          ) : !loading && flat.length === 0 && results ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400">"{q.trim()}" için sonuç yok.</p>
          ) : (
            groups.map((group) => (
              <div key={group.title} className="py-2">
                <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <group.icon className="w-3.5 h-3.5" />
                  {group.title}
                </p>
                {group.items.map((item) => {
                  index += 1;
                  const i = index;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(item)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                        i === active ? 'bg-amber-500/15' : 'hover:bg-gray-700/40'
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block text-sm text-white font-medium truncate">{item.title}</span>
                        <span className="block text-xs text-gray-400 truncate">{item.subtitle}</span>
                      </span>
                      {item.right && <span className="shrink-0">{item.right}</span>}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="hidden sm:flex items-center gap-4 px-4 py-2 border-t border-gray-700 text-[11px] text-gray-500">
          <span>↑↓ seç</span>
          <span>Enter aç</span>
          <span>Esc kapat</span>
        </div>
      </div>
    </div>
  );
};

export default CommandSearch;
