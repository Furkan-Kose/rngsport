import { useState, useEffect } from "react";
import { Check, Camera, Video, Sparkles, ShoppingCart, CheckCircle, Star, Loader2 } from "lucide-react";
import { useCart, type Package } from "../context/CartContext";
import api from "../lib/api";

export type PackageCategory = "photo" | "video" | "full";
export type { Package };

interface PackageCardProps {
  pkg: Package;
  featured?: boolean;
}

const PackageCard = ({ pkg, featured = false }: PackageCardProps) => {
  const { addToCart, isInCart } = useCart();
  const inCart = isInCart(pkg.id);

  return (
    <div 
      className={`group relative bg-zinc-900/60 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1 flex flex-col ${
        featured 
          ? "border-2 border-fuchsia-500/50 hover:border-fuchsia-500" 
          : "border border-zinc-800 hover:border-zinc-700"
      }`}
    >
      {/* Featured Badge */}
      {featured && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-fuchsia-500 px-2.5 py-1 rounded-full">
          <Star className="w-3 h-3 text-white fill-white" />
          <span className="text-xs font-semibold text-white">Popüler</span>
        </div>
      )}

      {/* In Cart Badge */}
      {inCart && (
        <div className={`absolute top-3 ${featured ? 'right-3' : 'right-3'} z-10 flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full text-xs font-medium`}>
          <CheckCircle className="w-3 h-3" />
          Sepette
        </div>
      )}

      {/* Image */}
      <div className="relative h-40 overflow-hidden shrink-0">
        <img
          src={pkg.image}
          alt={pkg.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className={`text-lg font-semibold mb-3 ${featured ? 'text-fuchsia-100' : 'text-zinc-100'}`}>
          {pkg.name}
        </h3>
        
        {/* Pricing Table */}
        <div className="mb-4 space-y-1.5 text-sm">
          <div className="flex items-center justify-between py-1.5 border-b border-zinc-800">
            <span className="text-zinc-400">1 Seri</span>
            <span className={`text-lg font-bold ${featured ? 'text-fuchsia-400' : 'text-zinc-100'}`}>
              ₺{pkg.price.toLocaleString('tr-TR')}
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">2 Seri</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">%10</span>
            </div>
            <span className="font-semibold text-zinc-200">₺{pkg.discounts[2].toLocaleString('tr-TR')}</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">3 Seri</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">%10</span>
            </div>
            <span className="font-semibold text-zinc-200">₺{pkg.discounts[3].toLocaleString('tr-TR')}</span>
          </div>
        </div>

        <ul className="space-y-2 mb-5 flex-1">
          {pkg.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-zinc-400">
              <Check className={`w-4 h-4 mt-0.5 shrink-0 ${featured ? 'text-fuchsia-400' : 'text-emerald-500'}`} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <button 
          onClick={() => addToCart(pkg, 1)}
          className={`w-full py-2.5 px-4 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${
            featured 
              ? "bg-fuchsia-500 hover:bg-fuchsia-600 text-white" 
              : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          {inCart ? "Tekrar Ekle" : "Sepete Ekle"}
        </button>
      </div>
    </div>
  );
};

const Packages = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const { data } = await api.get('/api/packages');
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

  // Kategorilere göre filtrele
  const getPackagesByCategory = (category: PackageCategory) =>
    packages.filter((pkg) => pkg.category === category);

  const fullPackage = packages.find((pkg) => pkg.category === "full");

  if (loading) {
    return (
      <section id="packages" className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4 flex justify-center items-center min-h-100">
          <Loader2 className="w-10 h-10 text-fuchsia-400 animate-spin" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="packages" className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="packages" className="py-20 bg-zinc-950">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-fuchsia-500 font-semibold uppercase tracking-wider text-sm">
            <Sparkles className="w-4 h-4" />
            Fiyatlandırma
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold text-gray-200 mt-4 mb-6 ">
            Paketlerimiz
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Her bütçeye uygun profesyonel fotoğraf ve video paketleri
          </p>
        </div>

        {/* Full Package - Featured */}
        {fullPackage && (
          <div className="mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/30 flex items-center justify-center">
                <Star className="w-5 h-5 text-fuchsia-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Komple Paket</h3>
                <p className="text-zinc-500 text-sm">Tüm hizmetler tek pakette</p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="w-full max-w-sm">
                <PackageCard pkg={fullPackage} featured />
              </div>
            </div>
          </div>
        )}

        {/* Photo Packages */}
        {getPackagesByCategory("photo").length > 0 && (
          <div className="mb-14">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <Camera className="w-5 h-5 text-zinc-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Fotoğraf Paketleri</h3>
                <p className="text-zinc-500 text-sm">Profesyonel fotoğraf çekimi</p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="grid sm:grid-cols-2 gap-5 max-w-2xl w-full items-stretch">
                {getPackagesByCategory("photo").map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Video Packages */}
        {getPackagesByCategory("video").length > 0 && (
          <div>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <Video className="w-5 h-5 text-zinc-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Video Paketleri</h3>
                <p className="text-zinc-500 text-sm">Profesyonel video çekimi</p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="grid sm:grid-cols-2 gap-5 max-w-2xl w-full items-stretch">
                {getPackagesByCategory("video").map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} />
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
