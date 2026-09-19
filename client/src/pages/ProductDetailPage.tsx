import { Link, useParams } from "react-router";
import { ArrowLeft, Check, MessageCircle, PackageX } from "lucide-react";
import SEO from "../components/SEO";
import Reveal from "../components/ui/Reveal";
import { ComingSoonBadge } from "../components/Products";
import { getProduct, notifyMeUrl } from "../data/products";

const ProductDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const product = getProduct(slug);

  // Router'da 404 rotası yok; bilinmeyen slug'ı burada karşılıyoruz
  if (!product) {
    return (
      <div className="min-h-screen bg-zinc-950 pt-32 pb-20">
        <SEO title="Ürün bulunamadı" url="https://rngsport.com/urunler" />
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center bg-zinc-900/60 border border-zinc-800 rounded-2xl p-10">
            <PackageX className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-white mb-2">
              Ürün bulunamadı
            </h1>
            <p className="text-zinc-400 mb-6">
              Aradığınız ürün kaldırılmış ya da adresi değişmiş olabilir.
            </p>
            <Link
              to="/urunler"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Tüm ürünlere dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-28 pb-16">
      <SEO
        title={product.name}
        description={`${product.tagline} ${product.cardSummary}`}
        keywords="kişiye özel sporcu figürü, ışıklı cimnastik harfi, ritmik cimnastik hediye, rng sport"
        image={product.image}
        url={`https://rngsport.com/urunler/${product.slug}`}
      />

      <div className="container mx-auto px-4">
        <Link
          to="/urunler"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-emerald-400 text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tüm ürünler
        </Link>

        <div className="max-w-5xl mx-auto">
          {/* Üst blok: görsel + başlık */}
          <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-center mb-16">
            <Reveal>
              <div className="relative">
                <div
                  aria-hidden
                  className="absolute -inset-4 bg-emerald-500/10 rounded-3xl blur-2xl"
                />
                <img
                  src={product.image}
                  alt={product.imageAlt}
                  className="relative w-full rounded-2xl shadow-2xl"
                />
              </div>
            </Reveal>

            <div>
              <Reveal delay={0.1}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-emerald-400 font-mono text-sm tracking-widest">
                    {product.number}
                  </span>
                  <span className="w-8 h-px bg-emerald-500/50" />
                  <ComingSoonBadge />
                </div>
              </Reveal>
              <Reveal delay={0.15}>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                  {product.name}
                </h1>
              </Reveal>
              <Reveal delay={0.2}>
                <p className="text-lg text-gradient-brand font-medium mb-6">
                  {product.tagline}
                </p>
              </Reveal>
              {product.intro.map((paragraph, i) => (
                <Reveal key={i} delay={0.25 + i * 0.05}>
                  <p className="text-gray-400 leading-relaxed mb-4">
                    {paragraph}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Bölümler */}
          <div className="space-y-14 max-w-3xl mx-auto">
            {product.sections.map((section, i) => (
              <Reveal key={section.title} delay={i * 0.06}>
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-4">
                    {section.title}
                  </h2>

                  {section.body?.map((paragraph, j) => (
                    <p key={j} className="text-gray-400 leading-relaxed mb-3">
                      {paragraph}
                    </p>
                  ))}

                  {section.bullets && (
                    <ul className="grid sm:grid-cols-2 gap-2 mt-5">
                      {section.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-2.5"
                        >
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-sm text-gray-300">
                            {bullet}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Reveal>
            ))}
          </div>

          {/* Meta şeridi */}
          <Reveal delay={0.1}>
            <p className="text-center text-sm text-zinc-500 tracking-wide mt-14 mb-10">
              {product.meta}
            </p>
          </Reveal>

          {/* CTA */}
          <Reveal delay={0.15}>
            <div className="relative rounded-3xl p-px bg-linear-to-r from-emerald-500/40 via-emerald-400/20 to-emerald-500/40 overflow-hidden max-w-3xl mx-auto">
              <div className="absolute inset-0 border-glow-shimmer opacity-60" />
              <div className="relative bg-linear-to-r from-emerald-900/40 to-teal-900/40 backdrop-blur-xl rounded-3xl p-8 md:p-12 text-center">
                <p className="text-emerald-300 text-sm font-semibold uppercase tracking-[0.18em] mb-3">
                  Çok Yakında
                </p>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                  {product.comingSoonNote}
                </h2>
                <a
                  href={notifyMeUrl(product.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5"
                >
                  <MessageCircle className="w-5 h-5" />
                  Satışa Çıkınca Haber Ver
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
