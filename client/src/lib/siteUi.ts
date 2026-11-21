/**
 * Müşteri sitesinin ortak sınıfları (components/ui/kit.tsx bileşenleri bunları kullanır).
 * Admin panelinin karşılığı: lib/adminUi.ts. Ayrı dosyada: bileşen dosyası yalnızca
 * bileşen export etsin (Fast Refresh).
 *
 * Kurallar: düğme / kart / form alanı sınıfı sayfalarda elle yazılmaz, buradan alınır.
 * Vurgu rengi tek: emerald (metin 400, dolgu 500). Amber yalnızca uyarı, sadakat ve
 * "öncelikli" için. Parlama gölgesi ve bulanık renk lekesi kullanılmaz.
 */
export const cx = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

export type ButtonVariant = "primary" | "secondary" | "ghost" | "link" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 border border-transparent",
  secondary: "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-100 border border-zinc-700",
  ghost: "bg-transparent hover:bg-zinc-800 text-zinc-300 hover:text-white border border-transparent",
  // Ghost'un yesil yazili hali. Ayri bir tur: ghost'un ustune text-emerald-* yazmak ise yaramaz
  // (iki yazi rengi sinifindan zinc kazanir, bkz. asagidaki cerceve rengi kurali).
  link: "bg-transparent hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 border border-transparent",
  danger: "bg-transparent hover:bg-red-500/10 text-red-400 hover:text-red-300 border border-red-500/40",
};

// md ve lg dokunma hedefi olarak en az 44px; sm yalnızca sık satırlarda (masaüstü)
const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "min-h-10 px-3 gap-1.5 text-sm",
  md: "min-h-11 px-5 gap-2 text-sm",
  lg: "min-h-12 px-6 gap-2 text-base",
};

export const buttonClass = (
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra?: string,
) =>
  cx(
    "inline-flex items-center justify-center rounded-xl font-semibold text-center",
    "transition-[color,background-color,border-color,transform] active:scale-[0.98]",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    extra,
  );

/** Yalnızca ikon taşıyan düğme (44px kare) */
export const iconButtonClass = (variant: ButtonVariant = "secondary", extra?: string) =>
  cx(
    "inline-flex items-center justify-center w-11 h-11 shrink-0 rounded-xl transition-colors",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    BUTTON_VARIANTS[variant],
    extra,
  );

/**
 * Kart: sitedeki tek panel stili.
 *
 * ÇERÇEVE RENGİ KURALI: bir öğeye iki çerçeve rengi sınıfı birden yazma
 * (`cx(cardClass, "border-emerald-500")` gibi). İkisi aynı anda bulununca kazananı
 * Tailwind'in ürettiği dosyadaki sıra belirler ve zinc, emerald/red'den SONRA gelir —
 * yeşil ya da kırmızı çerçeve sessizce gri kalır. Farklı renk gerekiyorsa
 * cardTone() / fieldClass() kullan; onlar tek bir renk sınıfı yazar.
 */
const cardBase = "bg-zinc-900/60 border rounded-2xl";

export type CardTone = "default" | "accent" | "soft" | "strong";

const CARD_BORDERS: Record<CardTone, string> = {
  default: "border-zinc-800",
  /** Öne çıkan kart (komple paket, seçili öğe) */
  accent: "border-emerald-500",
  /** Hafif vurgu (çağrı kutusu, rezervasyona açık yarışma) */
  soft: "border-emerald-500/50",
  /** Açık / etkin durum (açık SSS sorusu) */
  strong: "border-zinc-600",
};

export const cardTone = (tone: CardTone = "default") => `${cardBase} ${CARD_BORDERS[tone]}`;
export const cardClass = cardTone("default");
/** Kart içindeki satır / kutu */
export const innerRowClass = "bg-zinc-800/40 border border-zinc-700/60 rounded-xl";

export const labelClass = "block text-sm font-medium text-zinc-300 mb-1.5";

const inputBase = cx(
  "w-full min-h-11 px-4 py-2.5 bg-zinc-800/50 border rounded-xl text-white",
  "placeholder:text-zinc-500 outline-none transition-colors focus:ring-2",
  "disabled:opacity-60 disabled:cursor-not-allowed read-only:text-zinc-400",
);

/** Form alanı: geçerliyken gri, hatalıyken kırmızı çerçeve (ikisi birlikte asla yazılmaz) */
export const fieldClass = (invalid = false) =>
  cx(
    inputBase,
    invalid
      ? "border-red-500 focus:border-red-400 focus:ring-red-500/25"
      : "border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500/25",
  );
export const inputClass = fieldClass(false);

/** Seçilebilir çip (alet, seri, filtre) */
export const chipClass = (active: boolean, extra?: string) =>
  cx(
    "inline-flex items-center justify-center gap-1.5 min-h-10 px-3.5 rounded-xl border text-sm font-medium transition-colors",
    "disabled:opacity-40 disabled:cursor-not-allowed",
    active
      ? "bg-emerald-500/15 border-emerald-500 text-emerald-300"
      : "bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white",
    extra,
  );

export type Tone = "neutral" | "success" | "warning" | "danger" | "info";

export const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-zinc-800 text-zinc-300 border-zinc-700",
  success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  danger: "bg-red-500/15 text-red-300 border-red-500/30",
  info: "bg-sky-500/15 text-sky-300 border-sky-500/30",
};

/** Durum / rozet etiketi */
export const pillClass = (tone: Tone = "neutral", extra?: string) =>
  cx(
    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium whitespace-nowrap",
    TONE_CLASSES[tone],
    extra,
  );

/* Sayfa iskeleti */
/** Uygulama sayfaları (sepet, rezervasyon, profil…): sabit üst menünün altından başlar */
export const pageClass = "min-h-screen pt-28 pb-16";
export const containerClass = "container mx-auto px-4";
/** İçerik genişlikleri: form / içerik / ızgara */
export const widthForm = "max-w-2xl mx-auto";
export const widthContent = "max-w-4xl mx-auto";
export const widthGrid = "max-w-6xl mx-auto";

/* Başlık ölçeği: üç sabit boyut */
export const heroTitleClass = "text-4xl md:text-6xl font-bold text-white";
export const pageTitleClass = "text-2xl sm:text-3xl font-bold text-gradient-brand";
export const sectionTitleClass = "text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-100";

/** Küçük metin bağlantısı (geri dön vb.) */
export const textLinkClass =
  "inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-emerald-400 transition-colors";
