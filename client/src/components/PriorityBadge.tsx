import { useTranslation } from "react-i18next";

// Paket adının yanında "Öncelikli" etiketi (öncelik seçilmiş satırlar için)
const PriorityBadge = ({ show }: { show?: boolean }) => {
  const { t } = useTranslation();
  return show ? (
    <span className="inline-flex items-center ml-1.5 px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-semibold uppercase tracking-wide align-middle whitespace-nowrap">
      ⚡ {t("checkout.priority.badge")}
    </span>
  ) : null;
};

export default PriorityBadge;
