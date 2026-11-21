import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useTournaments, type Tournament } from '../lib/tournaments';

/**
 * Admin yarışma seçicisi (Paket Siparişleri, Rezervasyonlar, Dashboard, Çekim Listesi).
 * Seçim adres çubuğunda `?t=` olarak tutulur ve cihazda saklanır, böylece bir sayfada
 * seçilen yarışma diğer sayfalarda da açılır. Sıra: `?t=` → saklanan seçim → varsayılan
 *   (rezervasyona açık yarışma → devam eden → başlangıcı en yeni geçmiş yarışma).
 * Saklanan seçim, kaydedildiği andaki varsayılanla birlikte tutulur: varsayılan değişirse
 * (yeni yarışma açıldıysa) hatıra silinir — eski yarışmada takılı kalınmaz.
 * `value`: yarışma id'si ya da 'all'. `ready` false iken sayfa istek atmamalı
 * (önce "tümü" sonra varsayılan diye iki kez yüklenmesin).
 */
export const ALL_TOURNAMENTS = 'all';

const timeOf = (t: Tournament) => (t.startDate ? Date.parse(t.startDate) : 0);

export const defaultTournamentId = (list: Tournament[]): string => {
  const open = list.filter((t) => t.bookingOpen).sort((a, b) => timeOf(a) - timeOf(b))[0];
  if (open) return open.id;
  const ongoing = list.find((t) => t.status === 'ongoing');
  if (ongoing) return ongoing.id;
  // Geçmiş yarışmalardan en yenisi: tarih varsa ona, yoksa takvim sırasına göre
  const past = list
    .filter((t) => t.status === 'finished')
    .sort((a, b) => timeOf(b) - timeOf(a) || b.sortOrder - a.sortOrder)[0];
  return past?.id ?? ALL_TOURNAMENTS;
};

const STORE_KEY = 'admin-tournament';
interface StoredChoice {
  id: string;
  /** Seçim yapıldığı andaki varsayılan yarışma */
  def: string;
}

export const readStoredTournament = (): StoredChoice | null => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null');
    return raw && typeof raw.id === 'string' && typeof raw.def === 'string' ? raw : null;
  } catch {
    return null;
  }
};

/** Seçimi sakla; `list` o anki yarışma listesi (varsayılanı hesaplamak için) */
export const storeTournament = (id: string, list: Tournament[]) => {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ id, def: defaultTournamentId(list) }));
  } catch {
    /* gizli sekme: yalnızca bu sayfada geçerli olur */
  }
};

const clearStoredTournament = () => {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    /* yoksay */
  }
};

export const useAdminTournament = () => {
  const { tournaments, loading } = useTournaments();
  const [params, setParams] = useSearchParams();
  const fromUrl = params.get('t') ?? '';
  const [stored] = useState(readStoredTournament);
  const def = loading ? '' : defaultTournamentId(tournaments);
  // Saklanan seçim geçerli mi: varsayılan aynı kalmış ve yarışma hâlâ var
  const storedId =
    stored && !loading && stored.def === def && (stored.id === ALL_TOURNAMENTS || tournaments.some((t) => t.id === stored.id))
      ? stored.id
      : '';
  useEffect(() => {
    if (stored && !loading && !storedId) clearStoredTournament();
  }, [stored, loading, storedId]);
  const value = useMemo(() => (fromUrl ? fromUrl : loading ? '' : storedId || def), [fromUrl, loading, storedId, def]);
  const current = tournaments.find((t) => t.id === value) ?? null;
  return {
    tournaments,
    value,
    current,
    ready: value !== '',
    /** API'ye gidecek değer ('all' = filtre yok) */
    param: value || ALL_TOURNAMENTS,
    // Yarışma değişince sayfa ve açık detay sıfırlanır (tek güncelleme — art arda iki
    // setSearchParams birbirini ezebiliyor)
    setValue: (t: string) => {
      storeTournament(t, tournaments);
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('t', t);
          next.delete('page');
          next.delete('id');
          return next;
        },
        { replace: true },
      );
    },
  };
};
