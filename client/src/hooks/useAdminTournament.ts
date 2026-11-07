import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useTournaments, type Tournament } from '../lib/tournaments';

/**
 * Admin yarışma seçicisi (Paket Siparişleri, Rezervasyonlar, Dashboard, Çekim Listesi).
 * Seçim adres çubuğunda `?t=` olarak tutulur; yoksa varsayılan yarışma:
 *   rezervasyona açık yarışma → devam eden → başlangıcı en yeni geçmiş yarışma.
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

export const useAdminTournament = () => {
  const { tournaments, loading } = useTournaments();
  const [params, setParams] = useSearchParams();
  const fromUrl = params.get('t') ?? '';
  const value = useMemo(
    () => (fromUrl ? fromUrl : loading ? '' : defaultTournamentId(tournaments)),
    [fromUrl, loading, tournaments],
  );
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
    setValue: (t: string) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('t', t);
          next.delete('page');
          next.delete('id');
          return next;
        },
        { replace: true },
      ),
  };
};
