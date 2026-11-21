import { useTranslation } from "react-i18next";
import LocalizedLink from "./LocalizedLink";
import { ArrowRight } from "lucide-react";
import SectionHeader from "./ui/SectionHeader";
import ShowcaseGallery from "./ShowcaseGallery";
import { galleryItems } from "../data/gallery";
import { buttonClass } from "../lib/siteUi";

// Ana sayfada gösterilen seçki: ilk 6 video + seçilmiş 6 fotoğraf (tamamı /galeri'de)
const HOME_PHOTOS = new Set(["/gallery/44.webp", "/gallery/45.webp", "/gallery/46.webp", "/gallery/47.webp", "/gallery/48.webp", "/gallery/49.webp"]);

const homeItems = [
  ...galleryItems.filter((item) => item.type === "video").slice(0, 6),
  ...galleryItems.filter((item) => item.type === "photo" && item.src && HOME_PHOTOS.has(item.src)),
];

const Gallery = () => {
  const { t } = useTranslation();

  return (
    <section id="galeri" className="py-24 bg-black scroll-mt-20">
      <div className="container mx-auto px-4">
        <SectionHeader title={t("home.gallery.title")} description={t("home.gallery.description")} className="mb-10" />

        <ShowcaseGallery items={homeItems} />

        <div className="text-center mt-10">
          <LocalizedLink to="/galeri" className={buttonClass("secondary", "lg")}>
            {t("home.gallery.viewAll")}
            <ArrowRight className="w-4 h-4" aria-hidden />
          </LocalizedLink>
        </div>
      </div>
    </section>
  );
};

export default Gallery;
