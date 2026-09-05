// Rol ve "çekim izi" (track) sabitleri — backend'deki src/utils/roles.js ile eşleşir.

export const ROLES = {
  ADMIN: 'admin',
  PHOTOGRAPHER: 'fotografci',
  VIDEOGRAPHER: 'videocu',
  CUSTOMER: 'customer',
} as const;

export const STAFF_ROLES: string[] = [ROLES.PHOTOGRAPHER, ROLES.VIDEOGRAPHER];
export const SHOOTING_LIST_ROLES: string[] = [ROLES.ADMIN, ...STAFF_ROLES];

export type Track = 'all' | 'photo' | 'video';

// Personelin izi rolünden gelir; admin serbestçe seçer.
export const ROLE_TRACK: Record<string, Track> = {
  [ROLES.PHOTOGRAPHER]: 'photo',
  [ROLES.VIDEOGRAPHER]: 'video',
};

export const ROLE_LABELS: Record<string, string> = {
  [ROLES.ADMIN]: 'Yönetici',
  [ROLES.PHOTOGRAPHER]: 'Fotoğrafçı',
  [ROLES.VIDEOGRAPHER]: 'Videocu',
  [ROLES.CUSTOMER]: 'Müşteri',
};

export const roleLabel = (role?: string | null) =>
  (role && ROLE_LABELS[role]) || role || '';

export const TRACK_LABELS: Record<Track, string> = {
  all: 'Tümü',
  photo: 'Fotoğraf',
  video: 'Video',
};
