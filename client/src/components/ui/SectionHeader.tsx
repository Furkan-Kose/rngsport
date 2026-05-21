import type { LucideIcon } from "lucide-react";
import Reveal from "./Reveal";

interface SectionHeaderProps {
  eyebrow?: string;
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  gradient?: boolean;
  align?: "center" | "left";
  className?: string;
}

const SectionHeader = ({
  eyebrow,
  icon: Icon,
  title,
  description,
  gradient = false,
  align = "center",
  className = "",
}: SectionHeaderProps) => {
  const alignWrap = align === "center" ? "text-center mx-auto" : "text-left";
  const eyebrowJustify = align === "center" ? "justify-center" : "justify-start";

  return (
    <div className={`${alignWrap} ${className}`}>
      {eyebrow && (
        <Reveal>
          <div
            className={`inline-flex items-center gap-3 ${eyebrowJustify} mb-4`}
          >
            <span className="hidden sm:block w-8 h-px bg-emerald-500/50" />
            {Icon && <Icon className="w-4 h-4 text-emerald-400" />}
            <span className="text-emerald-400 font-semibold uppercase tracking-[0.18em] text-xs sm:text-sm">
              {eyebrow}
            </span>
            <span className="hidden sm:block w-8 h-px bg-emerald-500/50" />
          </div>
        </Reveal>
      )}

      <Reveal delay={0.08}>
        <h2
          className={`text-3xl sm:text-5xl font-bold leading-tight mb-5 ${
            gradient ? "text-gradient-brand" : "text-gray-100"
          }`}
        >
          {title}
        </h2>
      </Reveal>

      {description && (
        <Reveal delay={0.16}>
          <p
            className={`text-gray-400 text-base sm:text-lg max-w-2xl ${
              align === "center" ? "mx-auto" : ""
            }`}
          >
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
};

export default SectionHeader;
