import { useTranslation } from "react-i18next";
import SEO from "../components/SEO";
import PageHero from "../components/ui/PageHero";
import { ProductGrid } from "../components/Products";
import { useShowcase } from "../hooks/useShowcase";

const ProductsPage = () => {
  const { t } = useTranslation();
  const { items: products, onSale } = useShowcase();
  return (
    <div className="min-h-screen">
      <SEO
        title={t("pages.products.seoTitle")}
        description={t("pages.products.seoDescription")}
        keywords={t("pages.products.seoKeywords")}
      />

      <PageHero
        image="/products/product.jpeg"
        imageAlt={t("pages.products.heroAlt")}
        title={<span className="text-gradient-brand">{t("pages.products.title")}</span>}
        intro={t("pages.products.intro")}
      />

      <section className="pb-20">
        <div className="container mx-auto px-4">
          <ProductGrid items={products} />

          <p className="text-center text-sm text-zinc-400 mt-10 max-w-xl mx-auto">
            {onSale.length > 0 ? t("pages.shop.listNote") : t("pages.products.notYet")}
          </p>
        </div>
      </section>
    </div>
  );
};

export default ProductsPage;
