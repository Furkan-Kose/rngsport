import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import api, { API_URL } from '../lib/api';

/**
 * Admin menüsündeki sayı rozetleri.
 *
 * Kural (backend `controllers/admin.controller.js`): bu hesabın o sayfaya son bakışından beri
 * gelen yeni kayıt sayısı. Sayfaya girince o bölüm "görüldü" sayılır ve rozet sıfırlanır;
 * o sayfadayken gelen yeni kayıtlar da görülmüş sayılır.
 *
 * Yenilenme: sayfa değişince, 60 sn'de bir, sekmeye dönünce, sipariş/rezervasyon değişince (SSE)
 * ve `window` üzerinde `admin-badges-refresh` olayı tetiklenince.
 */

export type BadgeSection = 'orders' | 'reservations' | 'shopOrders' | 'feedback';
export type Badges = Record<BadgeSection, number>;

export const BADGE_SECTION_BY_PATH: Record<string, BadgeSection> = {
  '/admin/orders': 'orders',
  '/admin/reservations': 'reservations',
  '/admin/shop/orders': 'shopOrders',
  '/admin/feedback': 'feedback',
};

const EMPTY: Badges = { orders: 0, reservations: 0, shopOrders: 0, feedback: 0 };
const POLL_MS = 60_000;

/** Herhangi bir yerden rozetleri hemen yenilet (ör. görüş silinince) */
export const refreshAdminBadges = () => window.dispatchEvent(new Event('admin-badges-refresh'));

export const useAdminBadges = (enabled: boolean) => {
  const [badges, setBadges] = useState<Badges>(EMPTY);
  const location = useLocation();
  const sectionRef = useRef<BadgeSection | undefined>(BADGE_SECTION_BY_PATH[location.pathname]);

  // Açık bölüm (refresh içinden okunur); aşağıdaki effect'lerden önce güncellenir
  useEffect(() => {
    sectionRef.current = BADGE_SECTION_BY_PATH[location.pathname];
  }, [location.pathname]);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      // Açık olan bölüm: yeni gelenler de görülmüş sayılır
      const current = sectionRef.current;
      // Açık bölüm sayfasında "görüldü" isteği güncel rozetleri de döner (tek istek)
      const { data } = current
        ? await api.post('/api/admin/badges/seen', { section: current })
        : await api.get('/api/admin/badges');
      setBadges({
        orders: data.orders ?? 0,
        reservations: data.reservations ?? 0,
        shopOrders: data.shopOrders ?? 0,
        feedback: data.feedback ?? 0,
        ...(current && { [current]: 0 }),
      });
    } catch {
      /* rozet yoksa panel yine çalışır */
    }
  }, [enabled]);

  // Sayfa değişince sunucudan tazele (girilen bölüm aşağıda anında sıfır gösterilir)
  useEffect(() => {
    if (!enabled) return;
    // Arka arkaya hızlı sayfa geçişleri tek isteğe toplanır
    const timer = setTimeout(refresh, 150);
    return () => clearTimeout(timer);
  }, [location.pathname, enabled, refresh]);

  // Periyodik + sekmeye dönüş + elle tetikleme
  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(refresh, POLL_MS);
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('admin-badges-refresh', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('admin-badges-refresh', refresh);
    };
  }, [enabled, refresh]);

  // Sipariş / rezervasyon değişince (çekim listesi akışındaki `records` olayı)
  useEffect(() => {
    if (!enabled) return;
    const source = new EventSource(`${API_URL}/api/shooting-list/stream`, { withCredentials: true });
    let timer: ReturnType<typeof setTimeout> | undefined;
    const handle = () => {
      clearTimeout(timer);
      timer = setTimeout(refresh, 1500);
    };
    source.addEventListener('records', handle);
    return () => {
      clearTimeout(timer);
      source.removeEventListener('records', handle);
      source.close();
    };
  }, [enabled, refresh]);

  // Açık olan bölümün rozeti beklemeden sıfır görünür (sunucuya "görüldü" ayrıca gider)
  const current = BADGE_SECTION_BY_PATH[location.pathname];
  return current ? { ...badges, [current]: 0 } : badges;
};
