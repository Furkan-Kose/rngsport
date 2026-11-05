/**
 * Admin paneli ortak sınıfları (components/admin/ui.tsx bileşenleri bunları kullanır).
 * Ayrı dosyada: bileşen dosyası yalnızca bileşen export etsin (Fast Refresh).
 */
export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'soft';
export type ButtonSize = 'sm' | 'md';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-amber-500 hover:bg-amber-600 text-white border border-transparent',
  secondary: 'bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white border border-gray-700',
  soft: 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30',
  danger: 'bg-transparent hover:bg-red-500/10 text-red-400 hover:text-red-300 border border-red-500/40',
  ghost: 'bg-transparent hover:bg-gray-800 text-gray-400 hover:text-white border border-transparent',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 gap-1.5 text-sm',
  md: 'h-10 px-4 gap-2 text-sm',
};

export const buttonClass = (variant: ButtonVariant = 'secondary', size: ButtonSize = 'md', extra?: string) =>
  cx(
    'inline-flex items-center justify-center rounded-lg font-medium whitespace-nowrap transition-colors',
    'disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60',
    VARIANTS[variant],
    SIZES[size],
    extra,
  );

/** Tablo başlık satırı ve hücre sınıfları — tüm admin tablolarında aynı */
export const tableHeadRowClass = 'text-left text-xs uppercase tracking-wide text-gray-400 border-b border-gray-700 whitespace-nowrap';
export const thClass = 'px-4 py-3 font-medium';
export const tdClass = 'px-4 py-3';
export const tableBodyClass = 'divide-y divide-gray-700/50';
