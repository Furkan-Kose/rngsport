/**
 * Müşteri sitesinin ortak parçaları. Admin panelinin karşılığı: components/admin/ui.tsx.
 * Sınıflar lib/siteUi.ts'de; bağlantıları düğme gibi göstermek için oradaki
 * buttonClass() doğrudan LocalizedLink / <a> üzerinde kullanılır.
 */
import { forwardRef, useId } from "react";
import type {
  ButtonHTMLAttributes,
  ComponentProps,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { AlertCircle, AlertTriangle, ArrowLeft, CheckCircle2, Info, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import LocalizedLink from "../LocalizedLink";
import {
  buttonClass,
  cardTone,
  chipClass,
  cx,
  iconButtonClass,
  fieldClass,
  labelClass,
  pageTitleClass,
  pillClass,
  textLinkClass,
  type ButtonSize,
  type ButtonVariant,
  type CardTone,
  type Tone,
} from "../../lib/siteUi";

/* ------------------------------------------------------------------ Düğmeler */

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** true iken düğme pasifleşir ve spinner gösterir */
  loading?: boolean;
  icon?: LucideIcon;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", loading = false, icon: Icon, className, children, disabled, type = "button", ...props },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={buttonClass(variant, size, className)}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
      ) : (
        Icon && <Icon className="w-4 h-4 shrink-0" aria-hidden />
      )}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Ekran okuyucu adı — zorunlu, çünkü düğmede metin yok */
  label: string;
  icon: LucideIcon;
  variant?: ButtonVariant;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, icon: Icon, variant = "secondary", className, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={iconButtonClass(variant, className)}
      {...props}
    >
      <Icon className="w-5 h-5" aria-hidden />
    </button>
  ),
);
IconButton.displayName = "IconButton";

/* ---------------------------------------------------------------------- Kart */

interface CardProps extends ComponentProps<"div"> {
  /** İç boşluk: varsayılan "md" (p-5 sm:p-6); "none" görselli kartlar için */
  padding?: "none" | "md" | "lg";
  /** Çerçeve rengi — className ile ikinci bir border rengi yazma (bkz. lib/siteUi.ts) */
  tone?: CardTone;
}

const CARD_PADDING = { none: "", md: "p-5 sm:p-6", lg: "p-6 sm:p-8" };

export const Card = ({ padding = "md", tone = "default", className, ...props }: CardProps) => (
  <div className={cx(cardTone(tone), CARD_PADDING[padding], className)} {...props} />
);

/* --------------------------------------------------------------- Form alanları */

interface FieldProps {
  label: ReactNode;
  /** İçteki input/select/textarea'nın id'si */
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Etiket + alan + (varsa) hata ya da ipucu. Hata metninin id'si `${htmlFor}-error`. */
export const Field = ({ label, htmlFor, required, error, hint, className, children }: FieldProps) => (
  <div className={className}>
    <label htmlFor={htmlFor} className={labelClass}>
      {label}
      {required && (
        <span className="text-red-400 ml-0.5" aria-hidden>
          *
        </span>
      )}
    </label>
    {children}
    {error ? (
      <p id={`${htmlFor}-error`} className="mt-1.5 text-sm text-red-400">
        {error}
      </p>
    ) : (
      hint && <p className="mt-1.5 text-sm text-zinc-400">{hint}</p>
    )}
  </div>
);

interface InvalidProp {
  /** Alanı kırmızı kenarla gösterir ve aria-invalid ekler */
  invalid?: boolean;
}

const describedBy = (id: string | undefined, invalid?: boolean) =>
  invalid && id ? `${id}-error` : undefined;

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & InvalidProp>(
  ({ invalid, className, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy(props.id, invalid)}
      className={cx(fieldClass(invalid), className)}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & InvalidProp>(
  ({ invalid, className, ...props }, ref) => (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy(props.id, invalid)}
      className={cx(fieldClass(invalid), className)}
      {...props}
    />
  ),
);
Select.displayName = "Select";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & InvalidProp
>(({ invalid, className, ...props }, ref) => (
  <textarea
    ref={ref}
    aria-invalid={invalid || undefined}
    aria-describedby={describedBy(props.id, invalid)}
    className={cx(fieldClass(invalid), "resize-y", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  children: ReactNode;
}

/** Onay kutusu + metni; tüm satır tıklanabilir */
export const Checkbox = ({ children, className, id, ...props }: CheckboxProps) => {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label htmlFor={inputId} className={cx("flex items-start gap-3 cursor-pointer", className)}>
      <input
        id={inputId}
        type="checkbox"
        className="mt-0.5 w-5 h-5 shrink-0 rounded accent-emerald-500 cursor-pointer"
        {...props}
      />
      <span className="text-sm text-zinc-300">{children}</span>
    </label>
  );
};

/* ---------------------------------------------------------------------- Çip */

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
}

export const Chip = ({ active, className, type = "button", ...props }: ChipProps) => (
  <button type={type} aria-pressed={active} className={chipClass(active, className)} {...props} />
);

/* -------------------------------------------------------------------- Rozet */

interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  icon?: LucideIcon;
}

export const Pill = ({ tone = "neutral", icon: Icon, className, children, ...props }: PillProps) => (
  <span className={pillClass(tone, className)} {...props}>
    {Icon && <Icon className="w-3.5 h-3.5" aria-hidden />}
    {children}
  </span>
);

/* ------------------------------------------------------------- Bilgi kutusu */

const ALERT_TONES: Record<Exclude<Tone, "neutral">, { box: string; Icon: LucideIcon }> = {
  danger: { box: "bg-red-500/10 border-red-500/40 text-red-200", Icon: AlertCircle },
  warning: { box: "bg-amber-500/10 border-amber-500/30 text-amber-100", Icon: AlertTriangle },
  success: { box: "bg-emerald-500/10 border-emerald-500/30 text-emerald-100", Icon: CheckCircle2 },
  info: { box: "bg-zinc-800/60 border-zinc-700 text-zinc-200", Icon: Info },
};

interface AlertProps {
  tone?: Exclude<Tone, "neutral">;
  title?: ReactNode;
  icon?: LucideIcon;
  className?: string;
  children?: ReactNode;
}

/** Hata / uyarı / bilgi kutusu. Hata tonunda role="alert" ile okunur. */
export const Alert = ({ tone = "danger", title, icon, className, children }: AlertProps) => {
  const { box, Icon: DefaultIcon } = ALERT_TONES[tone];
  const Icon = icon ?? DefaultIcon;
  return (
    <div
      role={tone === "danger" ? "alert" : undefined}
      className={cx("flex items-start gap-3 px-4 py-3 rounded-xl border text-sm", box, className)}
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
      <div className="min-w-0 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------ Sayfa başlığı */

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Geri bağlantısı (dil öneki otomatik eklenir) */
  backTo?: string;
  backLabel?: string;
  /** Sağ taraftaki işlemler */
  actions?: ReactNode;
  className?: string;
}

/** Uygulama sayfalarının başlığı: geri bağlantısı + h1 + alt yazı + işlemler */
export const PageHeader = ({ title, subtitle, backTo, backLabel, actions, className }: PageHeaderProps) => (
  <header className={cx("mb-8", className)}>
    {backTo && (
      <LocalizedLink to={backTo} className={cx(textLinkClass, "mb-4")}>
        <ArrowLeft className="w-4 h-4" aria-hidden />
        {backLabel}
      </LocalizedLink>
    )}
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className={pageTitleClass}>{title}</h1>
        {subtitle && <p className="mt-1.5 text-zinc-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  </header>
);

/* ------------------------------------------------------- Boş / yükleme durumu */

interface EmptyStateProps {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  /** Düğme(ler) */
  children?: ReactNode;
  className?: string;
}

export const EmptyState = ({ icon: Icon, title, description, children, className }: EmptyStateProps) => (
  <Card padding="lg" className={cx("text-center", className)}>
    {Icon && <Icon className="w-10 h-10 mx-auto mb-4 text-zinc-500" aria-hidden />}
    <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
    {description && <p className="mt-2 text-zinc-400 max-w-md mx-auto">{description}</p>}
    {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
  </Card>
);

export const Spinner = ({ className, label }: { className?: string; label?: string }) => (
  <span role="status" className={cx("flex justify-center py-12", className)}>
    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" aria-hidden />
    <span className="sr-only">{label ?? "…"}</span>
  </span>
);

/** Yüklenen içeriğin yerini tutan gri blok */
export const Skeleton = ({ className }: { className?: string }) => (
  <div aria-hidden className={cx("rounded-xl bg-zinc-800/70 animate-pulse", className)} />
);
