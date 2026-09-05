import type { Track } from './roles';

/** Çekim izi — "all" sadece admin görünümü, saat kolonları her zaman tek ize aittir */
export type ShootTrack = Exclude<Track, 'all'>;

export interface TrackTimestamps {
  photoStartedAt: string | null;
  photoEndedAt: string | null;
  videoStartedAt: string | null;
  videoEndedAt: string | null;
}

// Bir kaydın seçili izine ait başlangıç/bitiş saatleri
export const trackTimes = (entry: TrackTimestamps, track: ShootTrack) =>
  track === 'photo'
    ? { startedAt: entry.photoStartedAt, endedAt: entry.photoEndedAt }
    : { startedAt: entry.videoStartedAt, endedAt: entry.videoEndedAt };
