import type { ReactNode } from "react";
import { cx, heroTitleClass } from "../../lib/siteUi";

interface PageHeroProps {
  image: string;
  imageAlt: string;
  title: ReactNode;
  intro?: ReactNode;
  /** Başlığın altındaki ek içerik (düğme vb.) */
  children?: ReactNode;
}

/**
 * Tanıtım sayfalarının (Hakkımızda, Galeri, Paketler, Ürünler, Ödül Törenleri) üst
 * bölümü: karartılmış fotoğraf + başlık. Alt kenar sayfa zeminine (zinc-950) erir.
 */
const PageHero = ({ image, imageAlt, title, intro, children }: PageHeroProps) => (
  <section className="relative pt-36 pb-28 md:pt-44 md:pb-36 overflow-hidden">
    <div className="absolute inset-0">
      <img src={image} alt={imageAlt} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/70" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-32 md:h-44 bg-linear-to-b from-transparent to-surface" />
    </div>

    <div className="container mx-auto px-4 relative">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className={cx(heroTitleClass, "leading-tight")}>{title}</h1>
        {intro && <p className="mt-5 text-lg md:text-xl text-zinc-300">{intro}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </div>
  </section>
);

export default PageHero;
