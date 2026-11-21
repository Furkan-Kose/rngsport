import { useTranslation } from "react-i18next";
import SectionHeader from "./ui/SectionHeader";
import Reveal from "./ui/Reveal";
import { STAGGER } from "../lib/motion";
import { cardClass, cx } from "../lib/siteUi";

interface Step {
  title: string;
  description: string;
}

// Numaralı daire: düz yeşil çerçeve (dönen halka / parlama yok)
const StepNumber = ({ n, className }: { n: string; className?: string }) => (
  <span
    className={cx(
      "flex items-center justify-center shrink-0 rounded-full bg-zinc-950 border-2 border-emerald-500/60 font-bold text-emerald-400",
      className,
    )}
  >
    {n}
  </span>
);

// Rezervasyondan teslimata adımlar. Geniş ekranda sağlı sollu zaman çizgisi,
// telefonda alt alta.
const Process = () => {
  const { t } = useTranslation();
  // Adım numarası sıradan türetilir (01, 02, ...)
  const steps = (t("home.process.steps", { returnObjects: true }) as Step[]).map((step, i) => ({
    ...step,
    number: String(i + 1).padStart(2, "0"),
  }));

  return (
    <section id="surec" className="py-24 bg-zinc-950 scroll-mt-20">
      <div className="container mx-auto px-4">
        <SectionHeader
          title={t("home.process.title")}
          description={t("home.process.description")}
          className="mb-16"
        />

        {/* Geniş ekran: ortada çizgi, kartlar bir solda bir sağda */}
        <ol className="hidden md:block relative max-w-4xl mx-auto space-y-12">
          <span aria-hidden className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px bg-zinc-800" />

          {steps.map((step, index) => {
            const isLeft = index % 2 === 0;
            return (
              <Reveal key={index} delay={index * STAGGER}>
                <li className={cx("relative flex items-center", isLeft ? "justify-start" : "justify-end")}>
                  <StepNumber n={step.number} className="absolute left-1/2 -translate-x-1/2 z-10 w-16 h-16 text-lg" />

                  <div className={cx("w-[calc(50%-3.5rem)]", isLeft ? "text-right" : "text-left")}>
                    <div className={cx(cardClass, "p-5")}>
                      <h3 className="text-lg font-bold text-zinc-100 mb-2">{step.title}</h3>
                      <p className="text-zinc-400 text-sm leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </li>
              </Reveal>
            );
          })}
        </ol>

        {/* Telefon: alt alta */}
        <ol className="md:hidden max-w-md mx-auto">
          {steps.map((step, index) => (
            <Reveal key={index} delay={index * STAGGER}>
              <li className="flex gap-4">
                <div className="flex flex-col items-center">
                  <StepNumber n={step.number} className="w-12 h-12 text-sm" />
                  {index < steps.length - 1 && <span aria-hidden className="w-px flex-1 my-2 bg-zinc-800" />}
                </div>
                <div className="flex-1 pb-8 pt-1">
                  <h3 className="text-base font-bold text-zinc-100 mb-1.5">{step.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{step.description}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default Process;
