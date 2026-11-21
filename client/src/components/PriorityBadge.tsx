import { Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

// Paket adının yanında "Öncelikli" etiketi (öncelik seçilmiş satırlar için)
const PriorityBadge = ({ show }: { show?: boolean }) => {
  const { t } = useTranslation();
  return show ? (
    <span className="inline-flex items-center gap-1 ml-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium align-middle whitespace-nowrap">
      <Zap className="w-3 h-3" aria-hidden />
      {t("checkout.priority.badge")}
    </span>
  ) : null;
};

export default PriorityBadge;
