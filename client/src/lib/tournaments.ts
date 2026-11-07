import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "./api";

/**
 * Yarışmalar (backend `Tournament`). Rezervasyon / sipariş / çekim günü bir yarışmaya bağlıdır;
 * müşteri yalnızca `bookingOpen` olan yarışmaya rezervasyon yapabilir (genelde tek yarışma).
 */
export type TournamentStatus = "finished" | "ongoing" | "upcoming";

export interface Tournament {
  id: string;
  name: string;
  date: string; // serbest metin ("11-14 Şubat 2027")
  location: string;
  flag: string | null;
  flagAlt: string | null;
  status: TournamentStatus;
  sortOrder: number;
  bookingOpen: boolean;
  startDate: string | null; // ISO; geri sayım için
  translations?: Record<string, Record<string, string>>;
}

/** Kayıtlarda dönen kısa yarışma bilgisi (istek dilinde) */
export interface TournamentRef {
  id: string;
  name: string;
  date?: string;
  location?: string;
}

// Aynı dilde sayfa boyunca tek istek: ana sayfa (takvim + geri sayım), rezervasyon ve sepet
// aynı listeyi kullanır. Admin bir yarışmayı değiştirince invalidateTournaments() çağırır.
const cache = new Map<string, Promise<Tournament[]>>();

export const fetchTournaments = (lang: string): Promise<Tournament[]> => {
  if (!cache.has(lang)) {
    const p = api
      .get<Tournament[]>("/api/tournaments")
      .then((r) => r.data)
      .catch((err) => {
        cache.delete(lang); // hata önbellekte kalmasın
        throw err;
      });
    cache.set(lang, p);
  }
  return cache.get(lang)!;
};

export const invalidateTournaments = () => cache.clear();

/** Rezervasyona açık yarışmalar, en yakın tarih önce */
export const openTournamentsOf = (list: Tournament[]) =>
  list
    .filter((t) => t.bookingOpen)
    .sort((a, b) => {
      const da = a.startDate ? Date.parse(a.startDate) : Infinity;
      const db = b.startDate ? Date.parse(b.startDate) : Infinity;
      return da - db || a.sortOrder - b.sortOrder;
    });

export const useTournaments = () => {
  const { i18n } = useTranslation();
  const [tournaments, setTournaments] = useState<Tournament[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchTournaments(i18n.language)
      .then((list) => alive && (setTournaments(list), setError(false)))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [i18n.language]);

  return {
    tournaments: tournaments ?? [],
    open: openTournamentsOf(tournaments ?? []),
    loading: tournaments === null && !error,
    error,
  };
};
