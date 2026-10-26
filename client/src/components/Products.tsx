import { useTranslation } from "react-i18next";
import LocalizedLink from "./LocalizedLink";
import { ArrowRight, Clock, ShoppingBag, Sparkles } from "lucide-react";
import SectionHeader from "./ui/SectionHeader";
import Reveal from "./ui/Reveal";
import { useShowcase } from "../hooks/useShowcase";
import { formatTL } from "../lib/loyalty";
import type { ShowcaseItem } from "../lib/shop";

/** "Çok Yakında" rozeti — Tournaments.tsx'teki amber rozet kalıbı */
export const ComingSoonBadge = () => {
  const { t } = useTranslation();
  return (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-semibold uppercase tracking-wider">
    <Clock className="w-3 h-3" />
    {t("home.products.comingSoon")}
  </span>
  );
};

/** Satıştaki ürünün fiyat rozeti */
export const PriceBadge = ({ price, note }: { price: number; note?: string }) => (
  // Dolgulu: açık renkli ürün görsellerinin üstünde de okunsun
  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 border border-emerald-400/60 text-white text-xs font-bold shadow-lg shadow-black/30">
    <ShoppingBag className="w-3 h-3" />
    {note && <span className="font-medium opacity-90">{note} ·</span>}
    {formatTL(price)}
  </span>
);

/** Ana sayfa bölümü, /urunler listeleme sayfası ve Galerim aynı kartı kullanır */
export const ProductCard = ({ product }: { product: ShowcaseItem }) => {
  const { t } = useTranslation();
  return (
  <LocalizedLink
    to={`/urunler/${product.slug}`}
    className="group relative h-full bg-zinc-900/60 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 flex flex-col border border-zinc-800 hover:border-emerald-500/40"
  >
    <div className="relative aspect-4/5 overflow-hidden shrink-0">
      <img
        src={product.image}
        alt={product.imageAlt}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
      <div className="absolute top-3 left-3">
        {product.purchasable && product.price ? <PriceBadge price={product.price} note={product.staticProduct?.priceNote} /> : <ComingSoonBadge />}
      </div>
      <span className="absolute bottom-3 left-4 text-5xl font-bold text-white/15 leading-none select-none">
        {product.number}
      </span>
    </div>

    <div className="p-5 flex flex-col flex-1">
      <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
        {product.name}
      </h3>
      {product.tagline && <p className="text-sm text-emerald-400/80 mt-1">{product.tagline}</p>}
      <p className="text-sm text-zinc-400 mt-3 leading-relaxed flex-1">
        {product.summary}
      </p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400">
        {product.purchasable ? t("pages.shop.buyNow") : t("home.products.view")}
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </span>
    </div>
  </LocalizedLink>
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
    <section id="urunler" className="relative py-24 bg-zinc-950">
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow={t("home.products.eyebrow")}
          icon={Sparkles}
          title={t("home.products.title")}
          description={t("home.products.description")}
          className="mb-10"
        />

        <Reveal delay={0.1}>
          <div className="max-w-2xl mx-auto text-center mb-12">
            <p className="text-gray-400 mb-2">
              {t("home.products.line1")}
            </p>
            <p className="text-gray-400 mb-6">
              {t("home.products.line2")}
            </p>
            <p className="inline-flex items-center gap-2 text-emerald-400 font-semibold tracking-wide">
              <Sparkles className="w-4 h-4" />
              {onSale.length > 0 ? t("pages.shop.onSaleLine") : t("home.products.comingSoonLine")}
            </p>
          </div>
        </Reveal>

        <div className={`grid grid-cols-1 gap-8 items-stretch mx-auto ${items.length > 1 ? "md:grid-cols-2 max-w-3xl" : "max-w-sm"}`}>
          {items.map((product, i) => (
            <Reveal key={product.slug} delay={i * 0.08} className="h-full">
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div className="text-center mt-10">
            <LocalizedLink
              to="/urunler"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors group"
            >
              {t("home.products.all")}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </LocalizedLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default Products;
