import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cx, iconButtonClass } from "../../lib/siteUi";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])';

/**
 * Pencere davranışı: Esc ile kapanır, Tab pencere içinde döner, sayfa kaydırması
 * kilitlenir, kapanınca odak açan öğeye döner. Kendi görünümünü çizen pencereler
 * (lightbox gibi) bunu doğrudan kullanır; diğerleri <Modal>.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useDialog = (open: boolean, onClose: () => void) => {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const node = ref.current;
    // İçeride zaten odak varsa (autoFocus) dokunma
    if (node && !node.contains(document.activeElement)) node.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === node)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [open]);

  return ref;
};

/** Tüm pencerelerin ortak arka planı. "site": pencere body'ye taşındığı için sitenin
    klavye odağı halkasını (index.css) kendi üstünde taşır. */
export const backdropClass = "site fixed inset-0 z-[9999] bg-black/80 animate-fade-in";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  /** Başlık yoksa ekran okuyucu adı */
  ariaLabel?: string;
  size?: "sm" | "md" | "lg";
  /** Alt kısımda sabit duran düğme satırı */
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}

const SIZES = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-3xl" };

/** Standart pencere: telefonda alttan tam genişlik, masaüstünde ortada kart */
const Modal = ({ open, onClose, title, ariaLabel, size = "md", footer, className, children }: ModalProps) => {
  const ref = useDialog(open, onClose);
  const titleId = useId();
  const { t } = useTranslation();

  if (!open) return null;

  return createPortal(
    <div
      className={cx(backdropClass, "flex items-end sm:items-center justify-center sm:p-4")}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : ariaLabel}
        tabIndex={-1}
        className={cx(
          "w-full max-h-[92dvh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-t-2xl sm:rounded-2xl outline-none animate-dialog-in",
          SIZES[size],
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
          {title ? (
            <h2 id={titleId} className="text-lg font-semibold text-white pt-2">
              {title}
            </h2>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className={iconButtonClass("ghost", "-mr-2 -mt-1")}
          >
            <X className="w-5 h-5" aria-hidden />
          </button>
        </div>
        <div className="px-5 pb-5 pt-3 sm:px-6 sm:pb-6 overflow-y-auto">{children}</div>
        {footer && (
          <div className="px-5 py-4 sm:px-6 border-t border-zinc-800 flex flex-wrap justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
