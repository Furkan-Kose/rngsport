import Hero from "../components/Hero";
import Tournaments from "../components/Tournaments";
import AwardCeremonies from "../components/AwardCeremonies";
import DiscountBanner from "../components/DiscountBanner";
import Packages from "../components/Packages";
import Products from "../components/Products";
import Gallery from "../components/Gallery";
import HowItWorks from "../components/Process";
import FAQ from "../components/FAQ";
import SEO from "../components/SEO";
import SectionDivider from "../components/ui/SectionDivider";

// Sectionlar alternate: siyah (#000) ↔ zinc-950 (#09090b)
// Tüm divider'lar aynı yön (no flip) — tutarlı çapraz akış
const BLACK = "#000000";
const ZINC = "#09090b";

const HomePage = () => {
  return (
    <div>
      <SEO
        title="Ana Sayfa"
        description="RNG Sport - Ritmik cimnastik başta olmak üzere spor yarışma ve turnuvaları için profesyonel fotoğraf, video ve dijital içerik üretimi sunan spor medya ajansı."
        url="https://rngsport.com"
      />
      <Hero />
      <DiscountBanner />
      <SectionDivider fromBg={ZINC} toBg={BLACK} />
      <Tournaments />
      <SectionDivider fromBg={BLACK} toBg={ZINC} />
      <Packages />
      <SectionDivider fromBg={ZINC} toBg={BLACK} />
      <AwardCeremonies />
      <SectionDivider fromBg={BLACK} toBg={ZINC} />
      <Products />
      <SectionDivider fromBg={ZINC} toBg={BLACK} />
      <Gallery />
      <SectionDivider fromBg={BLACK} toBg={ZINC} />
      <HowItWorks />
      <SectionDivider fromBg={ZINC} toBg={BLACK} />
      <FAQ />
      {/* Footer sınırı: çapraz değil, yumuşak gradient iniş */}
      <SectionDivider variant="fade" fromBg={BLACK} toBg={BLACK} height="lg" />
    </div>
  );
};

export default HomePage;
