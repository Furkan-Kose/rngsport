import { ArrowRight, Sparkles, Calendar, ChevronDown } from "lucide-react";
import { Link } from "react-router";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const Hero = () => {
  return (
    <section
      id=""
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
        
          src="/hero.webp"
          alt="Ritmik Cimnastik"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/60 to-transparent hidden md:block" />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/50 hidden md:block" />
        <div className="absolute inset-0 bg-black/60 md:hidden" />
      </div>

      {/* Decorative grid overlay (right side, very subtle) */}
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 w-1/2 bg-grid-dark opacity-40 hidden md:block"
      />

      {/* Single subtle ambient emerald glow */}
      <div
        aria-hidden
        className="absolute -bottom-32 right-1/4 w-[32rem] h-[32rem] bg-emerald-500/[0.06] rounded-full blur-3xl pointer-events-none"
      />

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-6 md:px-4 relative z-10 pt-20"
      >
        <div className="max-w-4xl text-center md:text-left">
          {/* Badge - all screens */}
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/40 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 shadow-[0_0_24px_-8px_rgba(16,185,129,0.6)]">
              <span className="relative flex w-2 h-2">
                <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
              </span>
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 text-sm font-medium">
                RNG Sport
              </span>
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={itemVariants}
            className="text-[2rem] leading-[1.2] md:text-5xl lg:text-6xl font-display font-bold text-white md:text-gray-100 md:leading-tight mb-5 md:mb-6"
          >
            Sporcunun
            <span className="block text-gradient-brand">
              En Değerli Anlarını,
            </span>
            Profesyonel Bir Hikayeye Dönüştürüyoruz.
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={itemVariants}
            className="text-gray-300 md:text-gray-400 text-base md:text-xl max-w-md md:max-w-xl mx-auto md:mx-0 mb-8 md:mb-10"
          >
            RNG Sport olarak ritmik cimnastik başta olmak üzere spor
            organizasyonlarında fotoğraf ve video prodüksiyon hizmeti
            sunuyoruz.
          </motion.p>

          {/* Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-row justify-center md:justify-start gap-3 md:gap-4"
          >
            <a
              href="#paketler"
              className="relative bg-emerald-500 hover:bg-emerald-600 text-white px-4 md:px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 group transition-colors text-sm md:text-base shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 overflow-hidden"
            >
              <span className="absolute inset-0 bg-linear-to-r from-emerald-400 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 relative z-10" />
              <span className="hidden sm:inline relative z-10">Paketleri </span>
              <span className="relative z-10">İncele</span>
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1 relative z-10" />
            </a>
            <Link
              to="/rezervasyon"
              className="bg-white/10 md:bg-black/30 hover:bg-emerald-600/15 border border-white/20 md:border-white/10 hover:border-emerald-500/60 text-white px-4 md:px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 group transition-all text-sm md:text-base backdrop-blur-sm"
            >
              <Calendar className="w-4 h-4 md:w-5 md:h-5 group-hover:text-emerald-400 transition-colors" />
              <span className="group-hover:text-emerald-400 transition-colors">
                Rezervasyon
              </span>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom fade — image dissolves into the next section (#09090b) */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-40 md:h-56 z-[5] bg-linear-to-b from-transparent to-[#09090b] pointer-events-none"
      />

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10 hidden md:flex flex-col items-center gap-2"
      >
        <span className="text-xs uppercase tracking-[0.3em] text-gray-500">
          Keşfet
        </span>
        <div className="w-6 h-10 rounded-full border-2 border-gray-500/50 flex items-start justify-center p-1.5">
          <ChevronDown className="w-3 h-3 text-emerald-400 animate-scroll-cue" />
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
