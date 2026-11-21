import Reveal from "./Reveal";
import { cx, sectionTitleClass } from "../../lib/siteUi";

interface SectionHeaderProps {
  /** Başlığın üstündeki kısa etiket. Yalnızca başlığın söylemediği bir bilgi
      taşıyorsa verilir ("Paketlerimiz" üstüne "Fiyatlandırma" yazılmaz). */
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  gradient?: boolean;
  align?: "center" | "left";
  className?: string;
}

const SectionHeader = ({
  eyebrow,
  title,
  description,
  gradient = false,
  align = "center",
  className = "mb-12",
}: SectionHeaderProps) => {
  const centered = align === "center";

  return (
    <Reveal className={cx(centered ? "text-center mx-auto" : "text-left", className)}>
      {eyebrow && <p className="text-sm font-semibold text-emerald-400 mb-3">{eyebrow}</p>}

      <h2 className={cx(sectionTitleClass, "leading-tight", gradient && "text-gradient-brand")}>{title}</h2>

      {description && (
        <p className={cx("mt-4 text-zinc-400 text-base sm:text-lg max-w-2xl", centered && "mx-auto")}>
          {description}
        </p>
      )}
    </Reveal>
  );
};

export default SectionHeader;
