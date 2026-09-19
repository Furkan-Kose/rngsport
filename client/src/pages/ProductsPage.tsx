import SEO from "../components/SEO";
import Reveal from "../components/ui/Reveal";
import { ProductCard } from "../components/Products";
import { products } from "../data/products";

const ProductsPage = () => {
  return (
    <div className="min-h-screen">
      <SEO
        title="Özel Ürünler"
        description="RNG Sport kişiye özel sporcu figürü ve ışıklı cimnastik harfi. Sporcunun pozundan, isminden ve sporundan yola çıkılarak hazırlanan özel tasarım ürünler."
        keywords="kişiye özel sporcu figürü, 3d cimnastikçi figür, ışıklı cimnastik harfi, ritmik cimnastik hediye"
        url="https://rngsport.com/urunler"
      />

      {/* Hero */}
      <section className="relative py-32 pb-44 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/products/figur.jpeg"
            alt="RNG Sport özel ürünler"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/85 via-black/75 to-black/65" />
        </div>
        <div
          aria-hidden
          className="absolute inset-0 bg-grid-dark opacity-40 pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute -bottom-20 left-1/3 w-[28rem] h-[28rem] bg-emerald-600/[0.06] rounded-full blur-3xl pointer-events-none"
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Reveal delay={0.1}>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                <span className="text-gradient-brand">Özel Ürünler</span>
              </h1>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
                Seri üretim bir dekorasyon ürünü değil; sporcunun kendisinden
                yola çıkılarak kişiselleştirilen tasarımlar.
              </p>
            </Reveal>
          </div>
        </div>

        {/* Alt fade to-[#09090b] sabit — sonraki bölüm bg-zinc-950 olmak zorunda */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-32 md:h-44 z-[5] bg-linear-to-b from-transparent to-[#09090b] pointer-events-none"
        />
      </section>

      <section className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-3xl mx-auto">
            {products.map((product, i) => (
              <Reveal key={product.slug} delay={i * 0.08} className="h-full">
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2}>
            <p className="text-center text-sm text-zinc-500 mt-10 max-w-xl mx-auto">
              Ürünler henüz siparişe açılmadı. Satışa çıktığında haberdar olmak
              için ürün sayfasından bize yazabilirsiniz.
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default ProductsPage;
