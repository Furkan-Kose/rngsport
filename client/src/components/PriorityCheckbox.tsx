import { Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatNumber } from "../lib/format";

interface PriorityCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  fee: number; // seri başına ek ücret
  className?: string;
}

// Rezervasyon formu ve sepetteki "Öncelikli" seçeneği + ne işe yaradığına dair kısa açıklama
const PriorityCheckbox = ({ checked, onChange, fee, className = "" }: PriorityCheckboxProps) => {
  const { t } = useTranslation();
  return (
    <label
      className={`flex items-start gap-3 cursor-pointer select-none rounded-xl border px-4 py-3 transition-colors ${
        checked ? "bg-amber-500/10 border-amber-500/50" : "bg-zinc-800/40 border-zinc-700/60 hover:border-zinc-500"
      } ${className}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-5 h-5 shrink-0 rounded accent-amber-500 cursor-pointer"
      />
      <span className="text-sm">
        <span className="flex flex-wrap items-center gap-x-1.5 text-zinc-200">
          <Zap className="w-4 h-4 text-amber-300" aria-hidden />
          <strong className="text-amber-300">{t("checkout.priority.title")}</strong>
          <span className="text-zinc-400">{t("checkout.priority.perSeries", { fee: formatNumber(fee) })}</span>
        </span>
        <span className="block text-zinc-400 mt-0.5">{t("checkout.priority.description")}</span>
      </span>
    </label>
  );
};

export default PriorityCheckbox;
