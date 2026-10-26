import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import LocalizedLink from "../components/LocalizedLink";
import { ArrowLeft, Check, Loader2, MessageCircle, PackageX, ShoppingBag, Truck } from "lucide-react";
import SEO from "../components/SEO";
import Reveal from "../components/ui/Reveal";
import { ComingSoonBadge, PriceBadge } from "../components/Products";
import { getProduct, localizeProduct, notifyMeUrlFor } from "../data/products";
import api from "../lib/api";
import { formatTL } from "../lib/loyalty";
import type { ShopProduct } from "../lib/shop";

const ProductDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const found = getProduct(slug);
  const staticProduct = found && localizeProduct(found, i18n.language);
  // Mağaza kaydı (aktifse), hangi ürün ve dil için yüklendiğiyle birlikte. Başka ürüne
  // geçilince eski kayıt kullanılmaz → shop undefined (yükleniyor); null = satışta değil/yok.
  const [loaded, setLoaded] = useState<{ key: string; data: ShopProduct | null } | null>(null);
  const loadKey = `${slug}:${i18n.language}`;
  const shop = loaded?.key === loadKey ? loaded.data : undefined;

  useEffect(() => {
    let alive = true;
    api
      .get<ShopProduct>(`/api/shop/products/${slug}`)
      .then(({ data }) => alive && setLoaded({ key: loadKey, data }))
      .catch(() => alive && setLoaded({ key: loadKey, data: null }));
    return () => {
      alive = false;
    };
  }, [slug, loadKey]);

  if (shop === undefined && !staticProduct) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  // Router'da 404 rotası yok; bilinmeyen slug'ı burada karşılıyoruz
  if (!shop && !staticProduct) {
    return (
      <div className="min-h-screen bg-zinc-950 pt-32 pb-20">
        <SEO title={t("pages.products.notFoundTitle")} />
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center bg-zinc-900/60 border border-zinc-800 rounded-2xl p-10">
            <PackageX className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-white mb-2">
              {t("pages.products.notFoundTitle")}
            </h1>
            <p className="text-zinc-400 mb-6">
              {t("pages.products.notFoundText")}
            </p>
            <LocalizedLink
              to="/urunler"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("pages.products.backAll")}
            </LocalizedLink>
          </div>
        </div>
      </div>
    );
  }

  const purchasable = !!shop?.purchasable && !!shop.price;
  const name = shop?.name ?? staticProduct!.name;
  const tagline = shop?.tagline ?? staticProduct?.tagline ?? "";
  const image = shop?.image ?? staticProduct?.image ?? "";
  const imageAlt = staticProduct?.imageAlt ?? name;
  // Eski ürünlerin uzun tanıtımı statik; yeni ürünlerde paneldeki açıklama paragrafları
  const intro = staticProduct?.intro ?? (shop?.description ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="min-h-screen bg-zinc-950 pt-28 pb-16">
      <SEO
        title={name}
        description={`${tagline} ${shop?.summary ?? staticProduct?.cardSummary ?? ""}`.trim()}
        keywords={t("pages.products.seoKeywords")}
        image={image}
      />

      <div className="container mx-auto px-4">
        <LocalizedLink
          to="/urunler"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-emerald-400 text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("pages.products.allProducts")}
        </LocalizedLink>

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
                  src={image}
                  alt={imageAlt}
                  className="relative w-full rounded-2xl shadow-2xl"
                />
              </div>
            </Reveal>

            <div>
              <Reveal delay={0.1}>
                <div className="flex items-center gap-3 mb-4">
                  {staticProduct && (
                    <>
                      <span className="text-emerald-400 font-mono text-sm tracking-widest">
                        {staticProduct.number}
                      </span>
                      <span className="w-8 h-px bg-emerald-500/50" />
                    </>
                  )}
                  {purchasable ? <PriceBadge price={shop!.price!} note={staticProduct?.priceNote} /> : <ComingSoonBadge />}
                </div>
              </Reveal>
              <Reveal delay={0.15}>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                  {name}
                </h1>
              </Reveal>
              {tagline && (
                <Reveal delay={0.2}>
                  <p className="text-lg text-gradient-brand font-medium mb-6">{tagline}</p>
                </Reveal>
              )}
              {intro.map((paragraph, i) => (
                <Reveal key={i} delay={0.25 + i * 0.05}>
                  <p className="text-gray-400 leading-relaxed mb-4 whitespace-pre-line">
                    {paragraph}
                  </p>
                </Reveal>
              ))}
              {purchasable && (
                <Reveal delay={0.3}>
                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <LocalizedLink
                      to={`/urunler/${slug}/siparis`}
                      className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-7 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      {t("pages.shop.buyFor", { price: formatTL(shop!.price!) })}
                    </LocalizedLink>
                    <span className="inline-flex items-center gap-1.5 text-sm text-zinc-400">
                      <Truck className="w-4 h-4 text-emerald-400" />
                      {t("pages.shop.freeShipping")}
                    </span>
                  </div>
                </Reveal>
              )}
            </div>
          </div>

          {/* Bölümler (eski ürünlerin tanıtım metni) */}
          {staticProduct && (
            <div className="space-y-14 max-w-3xl mx-auto">
              {staticProduct.sections.map((section, i) => (
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
          )}

          {/* Meta şeridi */}
          {staticProduct && (
            <Reveal delay={0.1}>
              <p className="text-center text-sm text-zinc-500 tracking-wide mt-14 mb-10">
                {staticProduct.meta}
              </p>
            </Reveal>
          )}

          {/* CTA */}
          <Reveal delay={0.15}>
            <div className="relative rounded-3xl p-px bg-linear-to-r from-emerald-500/40 via-emerald-400/20 to-emerald-500/40 overflow-hidden max-w-3xl mx-auto mt-10">
              <div className="absolute inset-0 border-glow-shimmer opacity-60" />
              <div className="relative bg-linear-to-r from-emerald-900/40 to-teal-900/40 backdrop-blur-xl rounded-3xl p-8 md:p-12 text-center">
                {purchasable ? (
                  <>
                    <p className="text-emerald-300 text-sm font-semibold uppercase tracking-[0.18em] mb-3">
                      {t("pages.shop.ctaEyebrow")}
                    </p>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                      {t("pages.shop.ctaTitle")}
                    </h2>
                    <p className="text-zinc-300 mb-6 max-w-xl mx-auto">{t("pages.shop.ctaText")}</p>
                    <LocalizedLink
                      to={`/urunler/${slug}/siparis`}
                      className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      {t("pages.shop.buyFor", { price: formatTL(shop!.price!) })}
                    </LocalizedLink>
                  </>
                ) : (
                  <>
                    <p className="text-emerald-300 text-sm font-semibold uppercase tracking-[0.18em] mb-3">
                      {t("pages.products.comingSoon")}
                    </p>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                      {staticProduct?.comingSoonNote ?? t("pages.products.notYet")}
                    </h2>
                    <a
                      href={notifyMeUrlFor(name, i18n.language)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5"
                    >
                      <MessageCircle className="w-5 h-5" />
                      {t("pages.products.notifyMe")}
                    </a>
                  </>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
