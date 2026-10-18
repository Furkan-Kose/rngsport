import { useTranslation } from "react-i18next";
import SEO from "../components/SEO";
import Reveal from "../components/ui/Reveal";
import Packages from "../components/Packages";
import SectionDivider from "../components/ui/SectionDivider";

const BLACK = "#000000";
const ZINC = "#09090b";

const PackagesPage = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen">
      <SEO
        title={t("pages.packagesPage.seoTitle")}
        description={t("pages.packagesPage.seoDescription")}
        keywords={t("pages.packagesPage.seoKeywords")}
      />

      {/* Hero */}
      <section className="relative py-32 pb-44 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/gallery/20.webp"
            alt={t("pages.packagesPage.imageAlt")}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/80 via-black/70 to-black/60" />
        </div>
        <div
          aria-hidden
          className="absolute inset-0 bg-grid-dark opacity-40 pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute -bottom-20 left-1/3 w-[28rem] h-[28rem] bg-emerald-600/[0.06] rounded-full blur-3xl pointer-events-none"
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Reveal delay={0.1}>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                <span className="text-gradient-brand">{t("pages.packagesPage.title")}</span>
              </h1>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
                {t("pages.packagesPage.intro")}
              </p>
            </Reveal>
          </div>
        </div>

        {/* Alt fade to-[#09090b] — Packages bölümü zaten bg-zinc-950 */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-32 md:h-44 z-[5] bg-linear-to-b from-transparent to-[#09090b] pointer-events-none"
        />
      </section>

      <Packages />

      {/* Footer sınırı: yumuşak gradient iniş */}
      <SectionDivider variant="fade" fromBg={ZINC} toBg={BLACK} height="lg" />
    </div>
  );
};

export default PackagesPage;
