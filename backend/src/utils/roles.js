// Rol ve "çekim izi" (track) tanımlarının tek kaynağı.
// Roller DB'de düz string olarak saklanır (User.role) ve JWT'ye gömülür.

export const ROLES = {
  ADMIN: "admin",
  PHOTOGRAPHER: "fotografci",
  VIDEOGRAPHER: "videocu",
  CUSTOMER: "customer",
};

// Admin panelinden açılabilen saha personeli rolleri
export const STAFF_ROLES = [ROLES.PHOTOGRAPHER, ROLES.VIDEOGRAPHER];

// Çekim listesini görebilen roller
export const SHOOTING_LIST_ROLES = [ROLES.ADMIN, ...STAFF_ROLES];

// Bir izin "çekilecek" saydığı paket kategorileri (Package.category → OrderItem.category)
export const TRACK_CATEGORIES = {
  photo: ["photo", "full"],
  video: ["video", "full"],
};

export const TRACKS = Object.keys(TRACK_CATEGORIES); // ["photo", "video"]

// Rol → sabit iz. Personel sadece kendi izini görür/düzenler.
export const ROLE_TRACK = {
  [ROLES.PHOTOGRAPHER]: "photo",
  [ROLES.VIDEOGRAPHER]: "video",
};

export const isStaffRole = (role) => STAFF_ROLES.includes(role);

// Personelde iz rolden gelir (query yok sayılır); admin "all" dahil seçebilir.
export const resolveTrack = (role, requested) => {
  if (ROLE_TRACK[role]) return ROLE_TRACK[role];
  return TRACKS.includes(requested) ? requested : "all";
};

// İz bazlı Prisma alan adları — tek yerden türetilir.
export const trackFields = (track) => ({
  willBeShot: track === "photo" ? "willBeShotPhoto" : track === "video" ? "willBeShotVideo" : "willBeShot",
  startedAt: track === "video" ? "videoStartedAt" : "photoStartedAt",
  endedAt: track === "video" ? "videoEndedAt" : "photoEndedAt",
});
