import { ArrowRight, Sparkles, Calendar } from "lucide-react";
import { Link } from "react-router";

const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="/hero.png"
          alt="Ritmik Cimnastik"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-black/50" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 pt-20">
        <div className="max-w-4xl">

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold text-gray-200 leading-tight mb-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Sezonun
            <span className="block text-fuchsia-500">En Büyük Buluşmasına,</span>
            Yakışır Bir Hatıra.
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-gray-400 max-w-xl mb-10 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            Performansın birkaç dakika sürer; ama o kusursuz duruş, doğru anda yakalandığında yıllarca seninle kalır. Ritmika Cup boyunca profesyonel ekibimizle en net, en güçlü anlarını yakalıyoruz.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "0.6s" }}>
            <a 
              href="#packages" 
              className="bg-fuchsia-500 hover:bg-fuchsia-600 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 group transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              Paketleri İncele
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </a>
            <Link 
              to="/reservation" 
              className="bg-black/30 hover:bg-violet-600/20 border border-white/10 hover:border-violet-500/50 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 group transition-all"
            >
              <Calendar className="w-5 h-5 group-hover:text-violet-400 transition-colors" />
              <span className="group-hover:text-violet-400 transition-colors">Rezervasyon Yap</span>
            </Link>
          </div>

        </div>
      </div>


    </section>
  );
};

export default Hero;