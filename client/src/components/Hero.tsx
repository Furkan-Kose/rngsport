import { ArrowRight, Sparkles, Calendar } from "lucide-react";
import { Link } from "react-router";

const Hero = () => {
  return (
    <section id="" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="/hero.webp"
          alt="Ritmik Cimnastik"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/60 to-transparent hidden md:block" />
        <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-black/50 hidden md:block" />
        {/* Mobile overlay - center focused */}
        <div className="absolute inset-0 bg-black/70 md:hidden" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 md:px-4 relative z-10 pt-20">
        <div className="max-w-4xl text-center md:text-left">

          {/* Badge - mobile only */}
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-4 py-1.5 mb-6 md:hidden">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-300 text-sm font-medium">RNG Sport</span>
          </div>

          {/* Heading */}
          <h1 className="text-[2rem] leading-[1.2] md:text-5xl lg:text-7xl font-display font-bold text-white md:text-gray-200 md:leading-tight mb-5 md:mb-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Sporcunun
            <span className="block text-emerald-500">En Değerli Anlarını,</span>
            Profesyonel Bir Hikayeye Dönüştürüyoruz.
          </h1>

          {/* Description */}
          <p className="text-gray-300 md:text-gray-400 text-base md:text-xl max-w-md md:max-w-xl mx-auto md:mx-0 mb-8 md:mb-10 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            RNG Sport olarak ritmik cimnastik başta olmak üzere spor organizasyonlarında fotoğraf ve video prodüksiyon hizmeti sunuyoruz.
          </p>

          {/* Buttons */}
          <div className="flex flex-row justify-center md:justify-start gap-3 md:gap-4 animate-fade-in" style={{ animationDelay: "0.6s" }}>
            <a 
              href="#paketler" 
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 md:px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 group transition-colors text-sm md:text-base"
            >
              <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Paketleri </span>İncele
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1" />
            </a>
            <Link 
              to="/rezervasyon" 
              className="bg-white/10 md:bg-black/30 hover:bg-emerald-600/20 border border-white/20 md:border-white/10 hover:border-emerald-500/50 text-white px-4 md:px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 group transition-all text-sm md:text-base"
            >
              <Calendar className="w-4 h-4 md:w-5 md:h-5 group-hover:text-emerald-400 transition-colors" />
              <span className="group-hover:text-emerald-400 transition-colors">Rezervasyon</span>
            </Link>
          </div>

        </div>
      </div>


    </section>
  );
};

export default Hero;