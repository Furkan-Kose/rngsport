import { useEffect, useMemo, useSyncExternalStore } from 'react';

/**
 * Admin paneli teması = zemin + vurgu rengi (iki bağımsız seçim; her zemin her vurguyla çalışır).
 *  - Zemin: panelde `gray-*` ile yazılan her şey  → index.css `html[data-admin-theme="…"]`
 *  - Vurgu: panelde `amber-*` ile yazılan her şey → index.css `html[data-admin-accent="…"]`
 * Renkler CSS değişkeni olarak tanımlı; bileşenlerde tema koşulu yoktur. Yeni zemin ya da
 * vurgu: buraya bir satır + index.css'e bir blok.
 *
 * Seçim tarayıcıda saklanır (cihaz başına). Panel açıkken <html>'e yazılır (pencereler
 * body'ye taşındığı için kök öğe), panelden çıkınca kaldırılır — müşteri sitesi etkilenmez.
 */
export interface AdminBackground {
  id: string;
  name: string;
  /** Ayarlar sayfasındaki önizleme: zemin, kart, çizgi */
  preview: { bg: string; card: string; line: string };
}

export interface AdminAccent {
  id: string;
  name: string;
  /** Önizleme ve renk düğmesi */
  color: string;
}

export const ADMIN_BACKGROUNDS: AdminBackground[] = [
  { id: 'gray', name: 'Koyu Gri', preview: { bg: '#111827', card: '#1f2937', line: '#374151' } },
  { id: 'black', name: 'Siyah', preview: { bg: '#050506', card: '#18181b', line: '#27272a' } },
  { id: 'charcoal', name: 'Kömür', preview: { bg: '#141414', card: '#212121', line: '#333333' } },
  { id: 'graphite', name: 'Grafit', preview: { bg: '#0d1117', card: '#161b22', line: '#30363d' } },
  { id: 'navy', name: 'Lacivert', preview: { bg: '#0b1120', card: '#1e293b', line: '#334155' } },
  { id: 'coffee', name: 'Kahve', preview: { bg: '#161311', card: '#231f1c', line: '#3a332e' } },
];

export const ADMIN_ACCENTS: AdminAccent[] = [
  { id: 'amber', name: 'Amber', color: '#f59e0b' },
  { id: 'orange', name: 'Turuncu', color: '#f97316' },
  { id: 'green', name: 'Yeşil', color: '#10b981' },
  { id: 'blue', name: 'Mavi', color: '#0ea5e9' },
  { id: 'indigo', name: 'İndigo', color: '#818cf8' },
  { id: 'violet', name: 'Mor', color: '#8b5cf6' },
  { id: 'pink', name: 'Pembe', color: '#ec4899' },
  { id: 'teal', name: 'Turkuaz', color: '#14b8a6' },
  { id: 'rose', name: 'Gül', color: '#f43f5e' },
];

export interface AdminThemeChoice {
  bg: string;
  accent: string;
}

const KEY = 'admin-theme';
const DEFAULT = 'gray|amber';
const EVENT = 'admin-theme-change';

// Tek parça tema döneminden kalan kayıtlar → zemin|vurgu
const LEGACY: Record<string, string> = {
  gray: 'gray|amber',
  black: 'black|amber',
  'black-green': 'black|green',
  navy: 'navy|blue',
  violet: 'gray|violet',
  forest: 'gray|green',
  bordeaux: 'gray|rose',
  charcoal: 'charcoal|teal',
};

/** Saklanan değer → geçerli "zemin|vurgu" (tanınmayan parça varsayılana düşer) */
const normalize = (saved: string | null) => {
  if (!saved) return DEFAULT;
  const [bg, accent] = (LEGACY[saved] ?? saved).split('|');
  const okBg = ADMIN_BACKGROUNDS.some((b) => b.id === bg) ? bg : 'gray';
  const okAccent = ADMIN_ACCENTS.some((a) => a.id === accent) ? accent : 'amber';
  return `${okBg}|${okAccent}`;
};

// Anlık görüntü düz metin: useSyncExternalStore her okumada aynı değeri görmeli
const read = () => {
  try {
    return normalize(localStorage.getItem(KEY));
  } catch {
    return DEFAULT;
  }
};

export const setAdminTheme = (choice: AdminThemeChoice) => {
  try {
    localStorage.setItem(KEY, `${choice.bg}|${choice.accent}`);
  } catch {
    /* gizli sekme: seçim saklanamaz, yoksay */
  }
  window.dispatchEvent(new Event(EVENT));
};

const subscribe = (onChange: () => void) => {
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', onChange); // başka sekmede değişirse
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
};

/** Seçili zemin + vurgu (değişince yeniden çizer) */
export const useAdminTheme = (): AdminThemeChoice => {
  const value = useSyncExternalStore(subscribe, read, () => DEFAULT);
  return useMemo(() => {
    const [bg, accent] = value.split('|');
    return { bg, accent };
  }, [value]);
};

/** Panel kök bileşenleri (AdminLayout, giriş sayfası) çağırır: temayı <html>'e uygular */
export const useApplyAdminTheme = () => {
  const theme = useAdminTheme();
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.adminTheme = theme.bg;
    root.dataset.adminAccent = theme.accent;
    return () => {
      delete root.dataset.adminTheme;
      delete root.dataset.adminAccent;
    };
  }, [theme]);
  return theme;
};
