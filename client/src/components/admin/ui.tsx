/**
 * Admin panelinin ortak arayüz parçaları. Her sayfa başlığı, butonu, filtre
 * satırı, kartı ve sayfalaması buradan gelir; böylece sayfalar aynı hizada
 * başlar ve aynı ölçüde butonlar kullanır.
 *
 * Kural: sayfa kendi dış padding'ini eklemez (AdminLayout veriyor), dış
 * sarmalayıcı `<div className="space-y-6">` olur.
 */
import type { ButtonHTMLAttributes, ComponentType, ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowDown, ArrowLeft, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import { buttonClass, cx, type ButtonSize, type ButtonVariant } from '../../lib/adminUi';

type IconType = ComponentType<{ className?: string }>;


/* ------------------------------------------------------------------ */
/* Başlık                                                             */
/* ------------------------------------------------------------------ */

export const PageHeader = ({
  title,
  icon: Icon,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  icon?: IconType;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { to: string; label: string };
}) => (
  <div>
    {back && (
      <Link
        to={back.to}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-amber-400 transition-colors mb-3"
      >
        <ArrowLeft className="w-4 h-4" />
        {back.label}
      </Link>
    )}
    {/* flex-wrap: butonlar başlığın yanına sığmazsa alt satıra geçer, başlık sıkışmaz */}
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
      <div className="min-w-0 max-w-full">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
          {Icon && <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500 shrink-0" />}
          <span className="min-w-0 wrap-break-word">{title}</span>
        </h1>
        {description && <div className="text-gray-400 mt-1 text-sm">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Butonlar                                                           */
/* ------------------------------------------------------------------ */

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconType;
  loading?: boolean;
  children?: ReactNode;
  className?: string;
  /** Verilirse react-router Link olarak render edilir */
  to?: string;
  /** Verilirse <a> olarak render edilir (yeni sekme için target="_blank") */
  href?: string;
  target?: string;
  /** Telefonda yalnızca ikon görünür (metin sm ve üstünde); title/aria-label metinden alınır */
  iconOnlyOnMobile?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'>;

export const Button = ({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  loading = false,
  children,
  className,
  to,
  href,
  target,
  type = 'button',
  disabled,
  iconOnlyOnMobile = false,
  ...rest
}: ButtonProps) => {
  const iconSize = 'w-4 h-4';
  const content = (
    <>
      {loading ? <Loader2 className={`${iconSize} animate-spin`} /> : Icon && <Icon className={iconSize} />}
      {iconOnlyOnMobile ? <span className="hidden sm:inline">{children}</span> : children}
    </>
  );
  const classes = buttonClass(variant, size, cx(iconOnlyOnMobile && 'max-sm:px-3', className));
  const label = iconOnlyOnMobile && typeof children === 'string' ? children : undefined;
  if (label && !rest.title) rest.title = label;
  if (label && !rest['aria-label']) rest['aria-label'] = label;

  if (to) {
    return (
      <Link to={to} className={classes} target={target} title={rest.title} aria-label={rest['aria-label']}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a
        href={href}
        className={classes}
        target={target}
        rel={target === '_blank' ? 'noreferrer' : undefined}
        title={rest.title}
        aria-label={rest['aria-label']}
      >
        {content}
      </a>
    );
  }
  return (
    <button type={type} className={classes} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  );
};

/** Satır içi kare ikon buton (düzenle / sil / galeri ...) */
export const IconButton = ({
  icon: Icon,
  title,
  tone = 'default',
  loading = false,
  className,
  to,
  type = 'button',
  disabled,
  ...rest
}: {
  icon: IconType;
  title: string;
  tone?: 'default' | 'danger' | 'accent';
  loading?: boolean;
  className?: string;
  to?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className' | 'title'>) => {
  const tones = {
    default: 'text-gray-300 hover:text-amber-400',
    accent: 'text-amber-400 hover:text-amber-300',
    danger: 'text-gray-300 hover:text-red-400 hover:bg-red-500/10',
  };
  const classes = cx(
    'inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    tones[tone],
    className,
  );
  const icon = loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />;
  if (to) {
    return (
      <Link to={to} className={classes} title={title} aria-label={title}>
        {icon}
      </Link>
    );
  }
  return (
    <button type={type} className={classes} title={title} aria-label={title} disabled={disabled || loading} {...rest}>
      {icon}
    </button>
  );
};

/* ------------------------------------------------------------------ */
/* Filtre satırı                                                      */
/* ------------------------------------------------------------------ */

/** Arama + filtreler için tek satır (mobilde alt alta) */
export const Toolbar = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cx('flex flex-col lg:flex-row lg:items-center gap-3', className)}>{children}</div>
);

export const SearchInput = ({
  value,
  onChange,
  placeholder = 'Ara...',
  onSubmit,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Verilirse Enter ile çalışır (anlık arama yerine) */
  onSubmit?: () => void;
  className?: string;
}) => (
  <form
    className={cx('relative w-full lg:max-w-sm', className)}
    onSubmit={(e) => {
      e.preventDefault();
      onSubmit?.();
    }}
    role="search"
  >
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-10 pl-9 pr-3 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
    />
  </form>
);

export interface FilterTab<K extends string = string> {
  key: K;
  label: ReactNode;
  count?: number;
}

/** Durum / kategori sekmeleri (sayılı hap butonlar) */
export const FilterTabs = <K extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: FilterTab<K>[];
  value: K;
  onChange: (key: K) => void;
  className?: string;
}) => (
  // Telefonda tek satır, yana kaydırılır; geniş ekranda alt satıra sarar
  <div className={cx('flex gap-2 overflow-x-auto no-scrollbar min-w-0 max-w-full lg:flex-wrap lg:overflow-visible', className)}>
    {tabs.map((t) => {
      const active = t.key === value;
      return (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={cx(
            'inline-flex shrink-0 items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap',
            active
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
              : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:text-gray-200',
          )}
        >
          {t.label}
          {t.count !== undefined && <span className={active ? 'text-amber-300/80' : 'text-gray-500'}>{t.count}</span>}
        </button>
      );
    })}
  </div>
);

/** Alt sekmeler (sayfa içi bölümler — ör. Müşteriler / Personel) */
export const SectionTabs = <K extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: FilterTab<K>[];
  value: K;
  onChange: (key: K) => void;
}) => (
  <div className="flex flex-wrap items-center gap-1 border-b border-gray-700">
    {tabs.map((t) => (
      <button
        key={t.key}
        type="button"
        onClick={() => onChange(t.key)}
        className={cx(
          'px-4 py-2.5 -mb-px border-b-2 text-sm font-medium transition-colors whitespace-nowrap',
          t.key === value ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-white',
        )}
      >
        {t.label}
        {t.count !== undefined && <span className="ml-1.5 text-gray-500">{t.count}</span>}
      </button>
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/* Kutular, kartlar, tablo                                            */
/* ------------------------------------------------------------------ */

export const Panel = ({
  children,
  className,
  padded = false,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) => (
  <div className={cx('bg-gray-800/50 border border-gray-700 rounded-xl', padded && 'p-4 sm:p-6', className)}>
    {children}
  </div>
);

/** Panel içi başlık satırı: ikon + başlık, sağda link/aksiyon */
export const PanelHeader = ({
  title,
  icon: Icon,
  iconClassName = 'text-amber-400',
  action,
  className,
}: {
  title: ReactNode;
  icon?: IconType;
  iconClassName?: string;
  action?: ReactNode;
  className?: string;
}) => (
  <div className={cx('flex items-center justify-between gap-3 mb-4', className)}>
    <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2 min-w-0">
      {Icon && <Icon className={cx('w-5 h-5 shrink-0', iconClassName)} />}
      <span className="truncate">{title}</span>
    </h2>
    {action}
  </div>
);

/** Bölüm başlığı (panel dışında, kart ızgaralarının üstü) */
export const SectionTitle = ({
  title,
  icon: Icon,
  iconClassName = 'text-amber-400',
  action,
}: {
  title: ReactNode;
  icon?: IconType;
  iconClassName?: string;
  action?: ReactNode;
}) => (
  <div className="flex items-center justify-between gap-3 mb-3">
    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
      {Icon && <Icon className={cx('w-5 h-5', iconClassName)} />}
      {title}
    </h2>
    {action}
  </div>
);

export type Tone = 'amber' | 'blue' | 'green' | 'yellow' | 'violet' | 'red' | 'gray' | 'teal' | 'sky';

const TONE_CLASSES: Record<Tone, { box: string; text: string }> = {
  amber: { box: 'bg-amber-500/20', text: 'text-amber-400' },
  blue: { box: 'bg-blue-500/20', text: 'text-blue-400' },
  green: { box: 'bg-green-500/20', text: 'text-green-400' },
  yellow: { box: 'bg-yellow-500/20', text: 'text-yellow-400' },
  violet: { box: 'bg-violet-500/20', text: 'text-violet-400' },
  red: { box: 'bg-red-500/20', text: 'text-red-400' },
  gray: { box: 'bg-gray-500/20', text: 'text-gray-400' },
  teal: { box: 'bg-teal-500/20', text: 'text-teal-400' },
  sky: { box: 'bg-sky-500/20', text: 'text-sky-400' },
};

export const StatCard = ({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'amber',
  to,
  reserveHint = false,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  /** Alt yazı yoksa da satırın yerini ayır: yan yana/alt alta kart satırları aynı boyda kalır */
  reserveHint?: boolean;
  icon?: IconType;
  tone?: Tone;
  /** Verilirse kart tıklanabilir link olur */
  to?: string;
}) => {
  const body = (
    <div className="flex items-center gap-3 sm:gap-4">
      {Icon && (
        <div className={cx('p-2 sm:p-3 rounded-lg shrink-0', TONE_CLASSES[tone].box)}>
          <Icon className={cx('w-5 h-5 sm:w-6 sm:h-6', TONE_CLASSES[tone].text)} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm text-gray-400 truncate">{label}</p>
        <p className="text-lg sm:text-2xl font-bold text-white truncate">{value}</p>
        {hint ? (
          <p className={cx('text-[11px] sm:text-xs truncate', TONE_CLASSES[tone].text, 'opacity-80')}>{hint}</p>
        ) : (
          reserveHint && (
            <p className="text-[11px] sm:text-xs invisible" aria-hidden="true">
              &nbsp;
            </p>
          )
        )}
      </div>
    </div>
  );
  const classes = 'block bg-gray-800/50 border border-gray-700 rounded-xl p-3 sm:p-5';
  if (to) {
    return (
      <Link to={to} className={cx(classes, 'hover:border-gray-600 hover:bg-gray-800 transition-colors')}>
        {body}
      </Link>
    );
  }
  return <div className={classes}>{body}</div>;
};

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  bare = false,
}: {
  icon?: IconType;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** true: kendi kutusu olmadan (bir Panel'in içinde) */
  bare?: boolean;
}) => (
  <div className={cx('text-center px-6 py-12', !bare && 'bg-gray-800/50 border border-gray-700 rounded-xl')}>
    {Icon && <Icon className="w-12 h-12 text-gray-600 mx-auto mb-4" />}
    <p className="text-gray-300 font-medium">{title}</p>
    {description && <p className="text-gray-500 text-sm mt-1">{description}</p>}
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>
);

export const LoadingState = ({ className }: { className?: string }) => (
  <div className={cx('flex items-center justify-center py-16', className)}>
    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
  </div>
);

/* ------------------------------------------------------------------ */
/* Sayfalama                                                          */
/* ------------------------------------------------------------------ */

export const Pagination = ({
  page,
  totalPages,
  onChange,
  total,
  limit,
  onLimitChange,
  className,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  /** Verilirse "41-60 / 312 kayıt" yazılır */
  total?: number;
  limit?: number;
  /** Verilirse "Sayfa başına 10 / 25 / 50 / 100" seçici çıkar (toplu seçim için de işe yarar) */
  onLimitChange?: (limit: number) => void;
  className?: string;
}) => {
  const showLimit = !!onLimitChange && total !== undefined && total > 10;
  if (totalPages <= 1 && !showLimit) return null;

  // Görünen sayfa numaraları: 1 … p-1 p p+1 … son
  const pages: (number | 'gap')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== 'gap') pages.push('gap');
  }

  return (
    <div
      className={cx(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-gray-700',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-gray-400">
          {total !== undefined && limit
            ? `${(page - 1) * limit + 1}–${Math.min(page * limit, total)} / ${total} kayıt`
            : `Sayfa ${page} / ${totalPages}`}
        </p>
        {showLimit && (
          <label className="flex items-center gap-2 text-sm text-gray-400">
            Sayfa başına
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="h-8 px-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {totalPages > 1 && (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Önceki sayfa"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, i) =>
          p === 'gap' ? (
            <span key={`gap-${i}`} className="w-8 text-center text-gray-500">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={cx(
                'min-w-8 h-8 px-2 rounded-lg text-sm font-medium transition-colors',
                p === page ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700',
              )}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Sonraki sayfa"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Sıralanabilir tablo başlığı (sunucu tarafı sıralama: ?sort=&dir=)   */
/* ------------------------------------------------------------------ */

export const SortableTh = ({
  label,
  field,
  sort,
  dir,
  onSort,
  className,
}: {
  label: ReactNode;
  field: string;
  /** Şu anki sıralama alanı ('' = varsayılan sıra) */
  sort: string;
  dir: 'asc' | 'desc';
  /** Aynı alana ikinci tık yönü çevirir, üçüncü tık varsayılana döner */
  onSort: (field: string, dir: 'asc' | 'desc' | null) => void;
  className?: string;
}) => {
  const active = sort === field;
  const Icon = !active ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown;
  const next = () => {
    if (!active) return onSort(field, field === 'createdAt' || field === 'totalPrice' ? 'desc' : 'asc');
    const firstDir = field === 'createdAt' || field === 'totalPrice' ? 'desc' : 'asc';
    if (dir === firstDir) return onSort(field, firstDir === 'asc' ? 'desc' : 'asc');
    return onSort(field, null);
  };
  return (
    <th className={cx('px-4 py-3 font-medium', className)} aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}>
      <button
        type="button"
        onClick={next}
        className={cx(
          'inline-flex items-center gap-1 uppercase tracking-wide transition-colors',
          active ? 'text-amber-400' : 'hover:text-gray-200',
        )}
      >
        {label}
        <Icon className={cx('w-3.5 h-3.5', !active && 'opacity-40')} />
      </button>
    </th>
  );
};

/* ------------------------------------------------------------------ */
/* İskelet yükleme görünümleri                                        */
/* ------------------------------------------------------------------ */

const Bone = ({ className }: { className?: string }) => <div className={cx('rounded bg-gray-700/60', className)} />;

/** Tablo/liste yüklenirken: satır taslakları */
export const SkeletonRows = ({ rows = 6, className }: { rows?: number; className?: string }) => (
  <div className={cx('animate-pulse divide-y divide-gray-700/50', className)} aria-busy="true" aria-label="Yükleniyor">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="flex items-center gap-4 px-4 py-4">
        <div className="flex-1 space-y-2">
          <Bone className="h-3.5 w-1/3" />
          <Bone className="h-3 w-1/5" />
        </div>
        <Bone className="hidden sm:block h-3.5 w-24" />
        <Bone className="h-5 w-16 rounded-full" />
        <Bone className="hidden md:block h-3.5 w-20" />
      </div>
    ))}
  </div>
);

/** Kart ızgarası yüklenirken (Dashboard / özet kartları) */
export const SkeletonCards = ({ count = 4, className }: { count?: number; className?: string }) => (
  <div className={cx('grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-pulse', className)} aria-busy="true">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
        <Bone className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Bone className="h-3 w-2/3" />
          <Bone className="h-5 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

/** Kare karo ızgarası yüklenirken (galeriler, ürün kartları) */
export const SkeletonGrid = ({
  count = 10,
  className = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3',
  tileClassName = 'aspect-square',
}: {
  count?: number;
  className?: string;
  tileClassName?: string;
}) => (
  <div className={cx(className, 'animate-pulse')} aria-busy="true" aria-label="Yükleniyor">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className={cx('rounded-xl bg-gray-800 border border-gray-700', tileClassName)} />
    ))}
  </div>
);

/** Bütün sayfa yüklenirken (sayfa geçişi, detay sayfası): başlık + kartlar + satırlar */
export const SkeletonPage = ({ cards = true }: { cards?: boolean }) => (
  <div className="space-y-6" aria-busy="true" aria-label="Yükleniyor">
    <div className="animate-pulse flex items-center gap-3">
      <Bone className="w-7 h-7 rounded-lg" />
      <div className="space-y-2">
        <Bone className="h-6 w-48" />
        <Bone className="h-3 w-64" />
      </div>
    </div>
    {cards && <SkeletonCards />}
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
      <SkeletonRows rows={5} />
    </div>
  </div>
);

