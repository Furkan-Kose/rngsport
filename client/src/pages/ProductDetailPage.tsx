import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import LocalizedLink from "../components/LocalizedLink";
import { ArrowLeft, Check, PackageX, ShoppingBag, Truck } from "lucide-react";
import SEO from "../components/SEO";
import Reveal from "../components/ui/Reveal";
import { ComingSoonBadge, PriceBadge } from "../components/Products";
import ProductImageCarousel from "../components/shop/ProductImageCarousel";
import { getProduct, localizeProduct, notifyMeUrlFor } from "../data/products";
import api from "../lib/api";
import { formatTL } from "../lib/loyalty";
import type { ShopProduct } from "../lib/shop";
import { useAuth } from "../context/AuthContext";
import WhatsAppIcon from "../components/ui/WhatsAppIcon";
import { Card, EmptyState, Spinner } from "../components/ui/kit";
import { buttonClass, containerClass, cx, innerRowClass, pageClass, textLinkClass } from "../lib/siteUi";

const ProductDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
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
      <div className={pageClass}>
        <Spinner label={t("common.loading")} />
      </div>
    );
  }

  // Router'da 404 rotası yok; bilinmeyen slug'ı burada karşılıyoruz
  if (!shop && !staticProduct) {
    return (
      <div className={pageClass}>
        <SEO title={t("pages.products.notFoundTitle")} noindex />
        <div className={containerClass}>
          <EmptyState
            icon={PackageX}
            title={t("pages.products.notFoundTitle")}
            description={t("pages.products.notFoundText")}
            className="max-w-md mx-auto mt-10"
          >
            <LocalizedLink to="/urunler" className={buttonClass("primary")}>
              {t("pages.products.backAll")}
            </LocalizedLink>
          </EmptyState>
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
    <div className={pageClass}>
      <SEO
        title={name}
        description={`${tagline} ${shop?.summary ?? staticProduct?.cardSummary ?? ""}`.trim()}
        keywords={t("pages.products.seoKeywords")}
        image={image}
      />

      <div className={containerClass}>
        <div className="max-w-5xl mx-auto">
          <LocalizedLink to="/urunler" className={cx(textLinkClass, "mb-8")}>
            <ArrowLeft className="w-4 h-4" aria-hidden />
            {t("pages.products.allProducts")}
          </LocalizedLink>

          {/* Üst blok: görsel + başlık */}
          <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-center mb-16">
            <Reveal>
              {/* Mobilde görsel ekranı kaplamasın: dar ve ortalı; masaüstünde sütun genişliğinde */}
              <div className="relative max-w-xs sm:max-w-sm mx-auto md:max-w-none">
                <ProductImageCarousel
                  images={shop?.images?.length ? shop.images : [image]}
                  alt={imageAlt}
                />
              </div>
            </Reveal>

            <div>
              <Reveal delay={0.1}>
                <div className="flex items-center gap-3 mb-4">
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
                  <p className="text-lg text-emerald-400 font-medium mb-6">{tagline}</p>
                </Reveal>
              )}
              {intro.map((paragraph, i) => (
                <Reveal key={i} delay={0.25 + i * 0.05}>
                  <p className="text-zinc-300 mb-4 whitespace-pre-line">
                    {paragraph}
                  </p>
                </Reveal>
              ))}
              {purchasable && (
                <Reveal delay={0.3}>
                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <LocalizedLink to={`/urunler/${slug}/siparis`} className={buttonClass("primary", "lg")}>
                      <ShoppingBag className="w-5 h-5" aria-hidden />
                      {t("pages.shop.buyFor", { price: formatTL(shop!.price!) })}
                    </LocalizedLink>
                    <span className="inline-flex items-center gap-1.5 text-sm text-zinc-400">
                      <Truck className="w-4 h-4 text-emerald-400" aria-hidden />
                      {t("pages.shop.freeShipping")}
                    </span>
                  </div>
                  {/* Sipariş için giriş gerekir; düğmeye basınca şaşırtmasın */}
                  {!isAuthenticated && <p className="mt-3 text-sm text-zinc-400">{t("pages.shop.loginNote")}</p>}
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
                      <p key={j} className="text-zinc-300 mb-3">
                        {paragraph}
                      </p>
                    ))}

                    {section.bullets && (
                      <ul className="grid sm:grid-cols-2 gap-2 mt-5">
                        {section.bullets.map((bullet) => (
                          <li
                            key={bullet}
                            className={cx(innerRowClass, "flex items-center gap-3 px-4 py-2.5")}
                          >
                            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="text-sm text-zinc-300">
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
              <p className="text-center text-sm text-zinc-400 tracking-wide mt-14 mb-10">
                {staticProduct.meta}
              </p>
            </Reveal>
          )}

          {/* CTA */}
          <Reveal delay={0.15}>
            <Card padding="lg" tone="soft" className="max-w-3xl mx-auto mt-10 text-center">
              {purchasable ? (
                <>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">{t("pages.shop.ctaTitle")}</h2>
                  <p className="text-zinc-300 mb-6 max-w-xl mx-auto">{t("pages.shop.ctaText")}</p>
                  <LocalizedLink to={`/urunler/${slug}/siparis`} className={buttonClass("primary", "lg")}>
                    <ShoppingBag className="w-5 h-5" aria-hidden />
                    {t("pages.shop.buyFor", { price: formatTL(shop!.price!) })}
                  </LocalizedLink>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-amber-300 mb-3">{t("pages.products.comingSoon")}</p>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                    {staticProduct?.comingSoonNote ?? t("pages.products.notYet")}
                  </h2>
                  <a
                    href={notifyMeUrlFor(name, i18n.language)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClass("primary", "lg")}
                  >
                    <WhatsAppIcon className="w-5 h-5" />
                    {t("pages.products.notifyMe")}
                  </a>
                </>
              )}
            </Card>
          </Reveal>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
