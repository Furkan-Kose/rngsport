import { useTranslation } from "react-i18next";
import LocalizedLink from "./LocalizedLink";
import { ArrowRight, Clock, ShoppingBag } from "lucide-react";
import SectionHeader from "./ui/SectionHeader";
import Reveal from "./ui/Reveal";
import { useShowcase } from "../hooks/useShowcase";
import { formatTL } from "../lib/loyalty";
import type { ShowcaseItem } from "../lib/shop";
import { Pill } from "./ui/kit";
import { cardClass, cx, textLinkClass } from "../lib/siteUi";
import { STAGGER } from "../lib/motion";

/** "Çok Yakında" rozeti */
export const ComingSoonBadge = () => {
  const { t } = useTranslation();
  return (
    <Pill tone="warning" icon={Clock} className="bg-zinc-950/80">
      {t("home.products.comingSoon")}
    </Pill>
  );
};

/** Satıştaki ürünün fiyat rozeti */
export const PriceBadge = ({ price, note }: { price: number; note?: string }) => (
  // Dolgulu: açık renkli ürün görsellerinin üstünde de okunsun
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500 text-zinc-950 text-xs font-bold">
    <ShoppingBag className="w-3.5 h-3.5" aria-hidden />
    {note && <span className="font-medium">{note} ·</span>}
    {formatTL(price)}
  </span>
);

/**
 * Ana sayfa bölümü ve /urunler listeleme sayfası aynı kartı kullanır.
 * wide: tek ürün varken geniş ekranda yatay kart (solda görsel, sağda metin) — dar ve
 * çok uzun tek bir dikey kart yerine. Telefonda yine dikey.
 */
export const ProductCard = ({ product, wide = false }: { product: ShowcaseItem; wide?: boolean }) => {
  const { t } = useTranslation();
  return (
    <LocalizedLink
      to={`/urunler/${product.slug}`}
      className={cx(
        cardClass,
        "group relative h-full overflow-hidden flex flex-col hover:border-zinc-600 transition-colors",
        wide && "md:flex-row",
      )}
    >
      <div className={cx("relative aspect-4/5 overflow-hidden shrink-0", wide && "md:w-2/5")}>
        <img
          src={product.image}
          alt={product.imageAlt}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3">
          {product.purchasable && product.price ? (
            <PriceBadge price={product.price} note={product.staticProduct?.priceNote} />
          ) : (
            <ComingSoonBadge />
          )}
        </div>
      </div>

      <div className={cx("p-5 flex flex-col flex-1", wide && "md:p-8 md:justify-center")}>
        <h3
          className={cx(
            "font-semibold text-white group-hover:text-emerald-400 transition-colors",
            wide ? "text-lg md:text-2xl" : "text-lg",
          )}
        >
          {product.name}
        </h3>
        {product.tagline && <p className="text-sm text-emerald-400 mt-1">{product.tagline}</p>}
        <p className={cx("text-sm text-zinc-400 mt-3 leading-relaxed", !wide && "flex-1")}>{product.summary}</p>
        <span className={cx("inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400", wide ? "mt-6" : "mt-4")}>
          {product.purchasable ? t("pages.shop.buyNow") : t("home.products.view")}
          <ArrowRight className="w-4 h-4" aria-hidden />
        </span>
      </div>
    </LocalizedLink>
  );
};

/** Ürün ızgarası: tek ürün yatay ve geniş, iki ve üzeri iki sütun */
export const ProductGrid = ({ items }: { items: ShowcaseItem[] }) => {
  const single = items.length === 1;
  return (
    <div
      className={cx(
        "grid grid-cols-1 gap-8 items-stretch mx-auto",
        single ? "max-w-sm md:max-w-3xl" : "md:grid-cols-2 max-w-3xl",
      )}
    >
      {items.map((product, i) => (
        <Reveal key={product.slug} delay={i * STAGGER} className="h-full">
          <ProductCard product={product} wide={single} />
        </Reveal>
      ))}
    </div>
  );
};

/**
 * Ana sayfa "Özel Ürünler" bölümü.
 * Ana sayfadaki siyah ↔ zinc-950 alternasyonuna dahil: Ödül Törenleri (siyah) ile
 * Galeri (siyah) arasında zinc zeminde durur, iki yanında da SectionDivider ile
 * çapraz geçiş vardır.
 */
const Products = () => {
  const { t } = useTranslation();
  const { items, onSale } = useShowcase();
  return (
    <section id="urunler" className="py-24 bg-zinc-950 scroll-mt-20">
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow={onSale.length > 0 ? t("pages.shop.onSaleLine") : t("home.products.comingSoonLine")}
          title={t("home.products.title")}
          description={t("home.products.description")}
        />

        <ProductGrid items={items} />

        <div className="text-center mt-10">
          <LocalizedLink to="/urunler" className={cx(textLinkClass, "text-base text-emerald-400 hover:text-emerald-300")}>
            {t("home.products.all")}
            <ArrowRight className="w-4 h-4" aria-hidden />
          </LocalizedLink>
        </div>
      </div>
    </section>
  );
};

export default Products;
