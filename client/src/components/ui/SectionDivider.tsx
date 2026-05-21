type Variant = "diagonal" | "wave-soft";
type Height = "sm" | "md" | "lg";

interface SectionDividerProps {
  variant?: Variant;
  flip?: boolean;
  /** Wrapper bg — must match the section ABOVE this divider */
  fromBg?: string;
  /** Path fill — must match the section BELOW this divider */
  toBg?: string;
  height?: Height;
  className?: string;
}

const heightMap: Record<Height, number> = {
  sm: 60,
  md: 100,
  lg: 140,
};

const paths: Record<Variant, string> = {
  diagonal: "M0,0 L1440,100 L1440,100 L0,100 Z",
  "wave-soft":
    "M0,50 C360,110 720,0 1080,50 C1260,75 1380,68 1440,50 L1440,100 L0,100 Z",
};

const SectionDivider = ({
  variant = "diagonal",
  flip = false,
  fromBg = "#000000",
  toBg = "#09090b",
  height = "md",
  className = "",
}: SectionDividerProps) => {
  const h = heightMap[height];

  return (
    <div
      aria-hidden
      className={`relative w-full pointer-events-none select-none -mt-px -mb-px overflow-hidden ${className}`}
      style={{ height: `${h}px`, backgroundColor: fromBg }}
    >
      <svg
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full block"
        style={{
          transform: flip ? "scaleY(-1)" : undefined,
          display: "block",
        }}
      >
        <path d={paths[variant]} fill={toBg} shapeRendering="geometricPrecision" />
      </svg>
    </div>
  );
};

export default SectionDivider;
