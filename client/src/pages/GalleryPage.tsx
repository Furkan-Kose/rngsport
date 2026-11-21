import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import SEO from "../components/SEO";
import PageHero from "../components/ui/PageHero";
import ShowcaseGallery from "../components/ShowcaseGallery";
import LocalizedLink from "../components/LocalizedLink";
import { galleryItems } from "../data/gallery";
import { buttonClass } from "../lib/siteUi";

const GalleryPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      <SEO
        title={t("pages.gallery.seoTitle")}
        description={t("pages.gallery.seoDescription")}
        keywords={t("pages.gallery.seoKeywords")}
      />

      <PageHero
        image="/gallery/7.webp"
        imageAlt={t("pages.gallery.imageAlt")}
        title={<span className="text-gradient-brand">{t("pages.gallery.title")}</span>}
        intro={t("pages.gallery.intro")}
      />

      <section className="pb-20">
        <div className="container mx-auto px-4">
          <ShowcaseGallery items={galleryItems} columns={4} />

          {/* Galeriyi gezen ziyaretçi için sonraki adım */}
          <div className="mt-16 text-center max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-zinc-100">{t("pages.gallery.ctaTitle")}</h2>
            <p className="mt-2 text-zinc-400">{t("pages.gallery.ctaText")}</p>
            <LocalizedLink to="/paketler" className={buttonClass("primary", "lg", "mt-6")}>
              {t("pages.gallery.ctaButton")}
              <ArrowRight className="w-4 h-4" aria-hidden />
            </LocalizedLink>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GalleryPage;
