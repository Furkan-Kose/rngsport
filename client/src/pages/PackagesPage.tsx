import { useTranslation } from "react-i18next";
import SEO from "../components/SEO";
import PageHero from "../components/ui/PageHero";
import Packages from "../components/Packages";

const PackagesPage = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen">
      <SEO
        title={t("pages.packagesPage.seoTitle")}
        description={t("pages.packagesPage.seoDescription")}
        keywords={t("pages.packagesPage.seoKeywords")}
      />

      <PageHero
        image="/gallery/20.webp"
        imageAlt={t("pages.packagesPage.imageAlt")}
        title={<span className="text-gradient-brand">{t("pages.packagesPage.title")}</span>}
        intro={t("pages.packagesPage.intro")}
      />

      {/* Başlık hero'da; bölümün kendi başlığı tekrar etmesin */}
      <Packages hideHeader />
    </div>
  );
};

export default PackagesPage;
