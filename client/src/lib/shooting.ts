import type { Track } from './roles';

/** Çekim izi — "all" sadece admin görünümü, saat kolonları her zaman tek ize aittir */
export type ShootTrack = Exclude<Track, 'all'>;

export interface TrackTimestamps {
  photoStartedAt: string | null;
  photoEndedAt: string | null;
  videoStartedAt: string | null;
  videoEndedAt: string | null;
}

// Bir kaydın başlangıç/bitiş saatleri. Süre TEK ve ortak: foto ve video ekibi aynı
// süreyi görür (backend'de foto kolonlarında tutulur). İz parametresi geriye uyum için.
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- iz parametresi çağıranlarla uyum için
export const trackTimes = (entry: TrackTimestamps, _track?: ShootTrack) => ({
  startedAt: entry.photoStartedAt,
  endedAt: entry.photoEndedAt,
});
