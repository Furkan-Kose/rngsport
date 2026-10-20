import { useEffect, useRef } from 'react';
import { API_URL } from '../lib/api';

/**
 * Admin Rezervasyonlar / Siparişler sayfaları için canlı yenileme.
 *
 * Çekim listesinin SSE akışındaki `records` olayını dinler: sunucu bunu yalnızca bir
 * sipariş/rezervasyon değiştiğinde gönderir (süre butonları göndermez).
 * - Arka arkaya gelen olaylar tek yenilemeye toplanır.
 * - `paused` iken (detay penceresi / form açık) gelen olay bekletilir, pencere
 *   kapanınca yenilenir — yazılanlar kaybolmasın.
 */
export const useRecordsLiveRefresh = (onRefresh: () => void, paused: boolean) => {
  const onRefreshRef = useRef(onRefresh);
  const pausedRef = useRef(paused);
  const pendingRef = useRef(false);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    pausedRef.current = paused;
    if (!paused && pendingRef.current) {
      pendingRef.current = false;
      onRefreshRef.current();
    }
  }, [paused]);

  // Bağımlılık [] — bağlantı sayfa açık kaldıkça bir kez kurulur
  useEffect(() => {
    const source = new EventSource(`${API_URL}/api/shooting-list/stream`, { withCredentials: true });
    let timer: ReturnType<typeof setTimeout> | undefined;

    const handle = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (pausedRef.current) pendingRef.current = true;
        else onRefreshRef.current();
      }, 800);
    };

    source.addEventListener('records', handle);
    // Bağlantı koparsa EventSource kendisi yeniden bağlanır
    return () => {
      clearTimeout(timer);
      source.removeEventListener('records', handle);
      source.close();
    };
  }, []);
};
