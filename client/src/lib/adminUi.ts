/**
 * Admin paneli ortak sınıfları (components/admin/ui.tsx bileşenleri bunları kullanır).
 * Ayrı dosyada: bileşen dosyası yalnızca bileşen export etsin (Fast Refresh).
 *
 * RENK KURALI: panelde vurgu rengi her zaman `amber-*`, zemin/çizgi rengi her zaman
 * `gray-*` sınıflarıyla yazılır. Tema (lib/adminTheme.ts + index.css) bu iki paletin CSS
 * değişkenlerini yeniden tanımlar; başka bir renk sınıfıyla (emerald, zinc, slate…)
 * yazılan vurgu ya da zemin temayla değişmez. Durum renkleri (yeşil/kırmızı/sarı/mavi/mor)
 * bilerek temadan bağımsızdır.
 *
 * Bir öğeye aynı özellik için iki renk sınıfı yazma (ör. inputClass + "border-red-500"):
 * hangisinin kazanacağı Tailwind'in çıktı sırasına bağlıdır. fieldClass(invalid) gibi
 * tek renk seçen yardımcıları kullan.
 */
export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'dangerSolid' | 'ghost' | 'soft';
export type ButtonSize = 'sm' | 'md';

const VARIANTS: Record<ButtonVariant, string> = {
  // Vurgu zemin üstünde koyu yazı: beyaz yazı amber üstünde okunmuyordu (2,1:1)
  primary: 'bg-amber-500 hover:bg-amber-400 text-gray-950 border border-transparent',
  secondary: 'bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white border border-gray-700',
  soft: 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30',
  danger: 'bg-transparent hover:bg-red-500/10 text-red-400 hover:text-red-300 border border-red-500/40',
  dangerSolid: 'bg-red-500 hover:bg-red-600 text-white border border-transparent',
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

/* Form alanları ------------------------------------------------------ */

const fieldBase =
  'w-full bg-gray-900/50 border rounded-lg text-white placeholder:text-gray-500 transition-colors ' +
  'focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed';

// min-h (h değil): aynı sınıf çok satırlı alanlarda da kullanılır
const FIELD_SIZES = { md: 'min-h-10 px-3 py-2 text-sm', sm: 'min-h-8 px-2 py-1 text-sm' };

/** Tek form alanı stili. invalid: kırmızı çerçeve (gri ile birlikte yazılmaz). */
export const fieldClass = (invalid = false, size: keyof typeof FIELD_SIZES = 'md') =>
  cx(
    fieldBase,
    FIELD_SIZES[size],
    invalid
      ? 'border-red-500 focus:border-red-400 focus:ring-red-500/25'
      : 'border-gray-700 focus:border-amber-500 focus:ring-amber-500/25',
  );
export const inputClass = fieldClass(false);
/** Çok satırlı alan: sabit yükseklik yerine iç boşluk */
export const textareaClass = (invalid = false) => cx(fieldClass(invalid), 'resize-y');
export const labelClass = 'block text-sm font-medium text-gray-300 mb-1.5';
export const checkboxClass = 'w-4 h-4 shrink-0 rounded accent-amber-500 cursor-pointer';

/* Rozet / uyarı tonları ------------------------------------------------ */

export type BadgeTone = 'gray' | 'accent' | 'green' | 'red' | 'yellow' | 'blue' | 'purple';

export const BADGE_TONES: Record<BadgeTone, string> = {
  gray: 'bg-gray-500/15 text-gray-300 border-gray-500/30',
  accent: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  green: 'bg-green-500/15 text-green-400 border-green-500/30',
  red: 'bg-red-500/15 text-red-400 border-red-500/30',
  yellow: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
};

export const badgeClass = (tone: BadgeTone = 'gray', extra?: string) =>
  cx(
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium whitespace-nowrap',
    BADGE_TONES[tone],
    extra,
  );

/* Kutular ------------------------------------------------------------- */

export const panelClass = 'bg-gray-800/50 border border-gray-700 rounded-xl';
/** Panel içindeki alt kutu */
export const subPanelClass = 'bg-gray-900/40 border border-gray-700 rounded-lg';

/** Tablo başlık satırı ve hücre sınıfları — tüm admin tablolarında aynı */
export const tableHeadRowClass = 'text-left text-xs uppercase tracking-wide text-gray-400 border-b border-gray-700 whitespace-nowrap';
export const thClass = 'px-4 py-3 font-medium';
export const tdClass = 'px-4 py-3';
export const tableBodyClass = 'divide-y divide-gray-700/50';
/** Tıklanabilir tablo satırı */
export const rowClickClass = 'cursor-pointer hover:bg-gray-700/20 transition-colors';
