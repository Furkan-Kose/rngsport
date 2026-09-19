import { Link } from "react-router";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import SectionHeader from "./ui/SectionHeader";
import Reveal from "./ui/Reveal";
import { products, type Product } from "../data/products";

/** "Çok Yakında" rozeti — Tournaments.tsx'teki amber rozet kalıbı */
export const ComingSoonBadge = () => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-semibold uppercase tracking-wider">
    <Clock className="w-3 h-3" />
    Çok Yakında
  </span>
);

/** Ana sayfa bölümü ve /urunler listeleme sayfası aynı kartı kullanır */
export const ProductCard = ({ product }: { product: Product }) => (
  <Link
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
        <ComingSoonBadge />
      </div>
      <span className="absolute bottom-3 left-4 text-5xl font-bold text-white/15 leading-none select-none">
        {product.number}
      </span>
    </div>

    <div className="p-5 flex flex-col flex-1">
      <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
        {product.name}
      </h3>
      <p className="text-sm text-emerald-400/80 mt-1">{product.tagline}</p>
      <p className="text-sm text-zinc-400 mt-3 leading-relaxed flex-1">
        {product.cardSummary}
      </p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400">
        İncele
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </span>
    </div>
  </Link>
);

/**
 * Ana sayfa "Özel Ürünler" bölümü.
 * Ana sayfadaki siyah ↔ zinc-950 alternasyonuna dahil: Paketler (zinc) ile
 * Galeri (zinc) arasında siyah zeminde durur, iki yanında da SectionDivider ile
 * çapraz geçiş vardır.
 */
const Products = () => {
  return (
    <section id="urunler" className="relative py-24 bg-black">
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Özel Ürünler"
          icon={Sparkles}
          title="Senin için tasarlanıyor."
          description="RNG SPORT ürünleri seri üretim bir dekorasyon ürünü olmak yerine, sporcunun kendisinden yola çıkılarak kişiselleştirilmek üzere tasarlanıyor."
          className="mb-10"
        />

        <Reveal delay={0.1}>
          <div className="max-w-2xl mx-auto text-center mb-12">
            <p className="text-gray-400 mb-2">
              İsmi, sporu, hatırlamak istediği an ve ona ait detaylar…
            </p>
            <p className="text-gray-400 mb-6">
              Ortaya çıkan ürün de yalnızca ona ait oluyor.
            </p>
            <p className="inline-flex items-center gap-2 text-emerald-400 font-semibold tracking-wide">
              <Sparkles className="w-4 h-4" />
              RNG SPORT Özel Ürünler — Çok Yakında
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-3xl mx-auto">
          {products.map((product, i) => (
            <Reveal key={product.slug} delay={i * 0.08} className="h-full">
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div className="text-center mt-10">
            <Link
              to="/urunler"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors group"
            >
              Tüm ürünleri gör
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default Products;
