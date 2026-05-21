import { useState, useEffect } from "react";
import {
  Check,
  Camera,
  Video,
  Sparkles,
  ShoppingCart,
  CheckCircle,
  Star,
  Loader2,
} from "lucide-react";
import { useCart, type Package } from "../context/CartContext";
import api from "../lib/api";
import SectionHeader from "./ui/SectionHeader";
import Reveal from "./ui/Reveal";

export type PackageCategory = "photo" | "video" | "full";
export type { Package };

const categoryMeta: Record<string, { label: string; Icon: typeof Camera }> = {
  photo: { label: "Fotoğraf", Icon: Camera },
  video: { label: "Video", Icon: Video },
};

interface PackageCardProps {
  pkg: Package;
  featured?: boolean;
}

const seriesOptions = [1, 2, 3] as const;

const PackageCard = ({ pkg, featured = false }: PackageCardProps) => {
  const { addToCart, isInCart } = useCart();
  const inCart = isInCart(pkg.id);
  const meta = categoryMeta[pkg.category];
  const [series, setSeries] = useState<1 | 2 | 3>(1);

  const priceFor = (n: 1 | 2 | 3) => (n === 1 ? pkg.price : pkg.discounts[n]);
  const discountFor = (n: 1 | 2 | 3) =>
    n === 1 ? 0 : Math.round((1 - pkg.discounts[n] / (pkg.price * n)) * 100);

  const selectedPrice = priceFor(series);
  const selectedDiscount = discountFor(series);

  const body = (
    <>
      <div className="relative h-40 overflow-hidden shrink-0">
        <img
          src={pkg.image}
          alt={pkg.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div
          className={`absolute inset-0 bg-linear-to-t to-transparent ${
            featured
              ? "from-zinc-950 via-zinc-950/40"
              : "from-zinc-900 via-zinc-900/40"
          }`}
        />

        {featured ? (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-linear-to-r from-emerald-500 to-emerald-600 px-2.5 py-1 rounded-full shadow-lg shadow-emerald-500/40">
            <Star className="w-3 h-3 text-white fill-white" />
            <span className="text-xs font-semibold text-white">Popüler</span>
          </div>
        ) : (
          meta && (
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-zinc-950/70 backdrop-blur-sm text-emerald-300 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-500/20">
              <meta.Icon className="w-3 h-3" />
              {meta.label}
            </div>
          )
        )}

        {inCart && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
            <CheckCircle className="w-3 h-3" />
            Sepette
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3
          className={`text-lg font-semibold mb-4 ${
            featured ? "text-emerald-100" : "text-zinc-100"
          }`}
        >
          {pkg.name}
        </h3>

        {/* Seri seçici — üç fiyat da görünür, seçili olan vurgulu */}
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {seriesOptions.map((n) => {
            const active = series === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setSeries(n)}
                aria-pressed={active}
                className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg border transition-all duration-200 ${
                  active
                    ? "bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/30"
                    : "bg-zinc-800/60 border-zinc-700/60 text-zinc-300 hover:border-emerald-500/40 hover:text-white"
                }`}
              >
                <span className="text-[11px] font-medium opacity-80">
                  {n} Seri
                </span>
                <span className="text-xs font-bold whitespace-nowrap">
                  ₺{priceFor(n).toLocaleString("tr-TR")}
                </span>
              </button>
            );
          })}
        </div>

        {/* Seçili özet */}
        <div className="flex items-baseline justify-between gap-2 mb-4">
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-bold ${
                featured ? "text-emerald-400" : "text-zinc-100"
              }`}
            >
              ₺{selectedPrice.toLocaleString("tr-TR")}
            </span>
            <span className="text-xs text-zinc-500">{series} seri</span>
          </div>
          {selectedDiscount > 0 && (
            <span className="text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full whitespace-nowrap">
              %{selectedDiscount} indirim
            </span>
          )}
        </div>

        <ul className="space-y-2 mb-5 flex-1">
          {pkg.features.map((feature, index) => (
            <li
              key={index}
              className="flex items-start gap-2 text-sm text-zinc-400"
            >
              <Check
                className={`w-4 h-4 mt-0.5 shrink-0 ${
                  featured ? "text-emerald-400" : "text-emerald-500"
                }`}
              />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={() => addToCart(pkg, series)}
          className={`w-full py-2.5 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
            featured
              ? "bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
              : "bg-zinc-800 hover:bg-emerald-500 text-zinc-200 hover:text-white border border-zinc-700 hover:border-emerald-500"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          {inCart ? "Tekrar Ekle" : "Sepete Ekle"}
          <span className="opacity-80">· {series} seri</span>
        </button>
      </div>
    </>
  );

  if (featured) {
    return (
      <div className="group relative h-full rounded-2xl p-px bg-linear-to-br from-emerald-500 via-emerald-300 to-emerald-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/30 overflow-hidden">
        <div className="absolute inset-0 border-glow-shimmer opacity-80" />
        <div className="relative bg-zinc-950 rounded-2xl overflow-hidden flex flex-col h-full">
          {body}
        </div>
      </div>
    );
  }

  return (
    <div className="group relative h-full bg-zinc-900/60 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 flex flex-col border border-zinc-800 hover:border-emerald-500/40">
      {body}
    </div>
  );
};

const CategoryDivider = () => (
  <div className="flex items-center justify-center gap-3 my-12">
    <span className="h-px w-16 bg-linear-to-r from-transparent to-emerald-500/30" />
    <span className="w-2 h-2 rounded-full bg-emerald-500/70 shadow-[0_0_10px_rgba(16,185,129,0.7)]" />
    <span className="h-px w-16 bg-linear-to-l from-transparent to-emerald-500/30" />
  </div>
);

const Packages = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const { data } = await api.get("/api/packages");
        setPackages(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bir hata oluştu");
        console.error("Paketler yüklenirken hata:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const getPackagesByCategory = (category: PackageCategory) =>
    packages.filter((pkg) => pkg.category === category);

  const fullPackage = packages.find((pkg) => pkg.category === "full");

  if (loading) {
    return (
      <section id="paketler" className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4 flex justify-center items-center min-h-100">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="paketler" className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="paketler" className="relative py-20 bg-zinc-950">
      <div className="container mx-auto px-4 relative z-10">
        <SectionHeader
          eyebrow="Fiyatlandırma"
          icon={Sparkles}
          title="Paketlerimiz"
          description="Her bütçeye uygun profesyonel fotoğraf ve video paketleri"
          gradient
          className="mb-16"
        />

        {(fullPackage || getPackagesByCategory("photo").length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
            {/* Full — DOM'da ilk: mobilde en üstte; masaüstünde ortada ve yukarıda */}
            {fullPackage && (
              <div className="mx-auto w-full max-w-sm md:max-w-none md:order-2 md:scale-105 md:z-10">
                <Reveal delay={0.15} className="h-full">
                  <PackageCard pkg={fullPackage} featured />
                </Reveal>
              </div>
            )}
            {/* Mobilde Full ile fotoğraflar arasında ayraç; masaüstünde gizli */}
            {fullPackage && getPackagesByCategory("photo").length > 0 && (
              <div className="md:hidden">
                <CategoryDivider />
              </div>
            )}
            {getPackagesByCategory("photo").map((pkg, i) => (
              <div
                key={pkg.id}
                className={`mx-auto w-full max-w-sm md:max-w-none ${
                  i === 0 ? "md:order-1" : "md:order-3"
                }`}
              >
                <Reveal delay={i * 0.08} className="h-full">
                  <PackageCard pkg={pkg} />
                </Reveal>
              </div>
            ))}
          </div>
        )}

        {getPackagesByCategory("video").length > 0 && (
          <div>
            <CategoryDivider />

            <div className="flex justify-center">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl w-full items-stretch">
                {getPackagesByCategory("video").map((pkg, i) => (
                  <Reveal
                    key={pkg.id}
                    delay={i * 0.08}
                    className="h-full mx-auto w-full max-w-sm md:max-w-none"
                  >
                    <PackageCard pkg={pkg} />
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Packages;
