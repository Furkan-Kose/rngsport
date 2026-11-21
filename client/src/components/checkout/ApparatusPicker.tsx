import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Chip } from "../ui/kit";
import { APPARATUSES } from "../../constants/apparatuses";
import { cx } from "../../lib/siteUi";

interface ApparatusPickerProps {
  selected: string[];
  /** Seçilmesi gereken alet sayısı (= seri sayısı) */
  max: number;
  onToggle: (slug: string) => void;
  disabled?: boolean;
  /** Eksik seçim kırmızıyla vurgulansın (gönderim denendikten sonra) */
  showError?: boolean;
  className?: string;
}

/** "Hangi aletler çekilecek" seçimi: seri sayısı kadar alet işaretlenir */
const ApparatusPicker = ({ selected, max, onToggle, disabled, showError, className }: ApparatusPickerProps) => {
  const { t } = useTranslation();
  const labelId = useId();
  const complete = selected.length === max;

  return (
    <div className={className}>
      <p id={labelId} className="text-sm font-medium text-zinc-300 mb-2">
        {t("checkout.apparatus.label")}
        <span className="text-red-400 ml-0.5" aria-hidden>
          *
        </span>{" "}
        <span className={cx("font-normal", complete ? "text-emerald-400" : showError ? "text-red-400" : "text-zinc-400")}>
          {t("checkout.apparatus.selected", { count: selected.length, total: max })}
        </span>
      </p>
      <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {APPARATUSES.map((a) => {
          const active = selected.includes(a.slug);
          return (
            <Chip
              key={a.slug}
              active={active}
              disabled={disabled || (!active && selected.length >= max)}
              onClick={() => onToggle(a.slug)}
            >
              {t(`common.apparatus.${a.slug}`)}
            </Chip>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-zinc-400">{t("checkout.apparatus.hint")}</p>
    </div>
  );
};

export default ApparatusPicker;
