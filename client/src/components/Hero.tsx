import { useEffect, useState } from "react";
import { ArrowRight, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import LocalizedLink from "./LocalizedLink";
import { buttonClass } from "../lib/siteUi";

// Dikey (1080x1920) ve yatay (1920x1080) iki ayri kurgu var; esik overlay'lerin
// kullandigi md kirilimiyla ayni tutuluyor.
const WEB_VIDEO = "/rngsport_hero_web.mp4";
const MOBILE_VIDEO = "/rngsport_hero_mobil.mp4";
const MOBILE_QUERY = "(max-width: 767px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const matches = (query: string) =>
  typeof window !== "undefined" && window.matchMedia(query).matches;

/**
 * Hero arka plan videosu.
 *
 * Tek <video> kullaniliyor, kaynak matchMedia ile seciliyor:
 * - <source media> guvenilmez (tarayicilar yeniden degerlendirmiyor)
 * - iki ayri <video> ise gizli olani da indirir -> 18 MB
 *
 * prefers-reduced-motion aciksa video hic yuklenmez, poster gorseli kalir.
 */
const useHeroVideoSrc = () => {
  const [src, setSrc] = useState<string | null>(() =>
    matches(REDUCED_MOTION_QUERY)
      ? null
      : matches(MOBILE_QUERY)
        ? MOBILE_VIDEO
        : WEB_VIDEO,
  );

  useEffect(() => {
    const mobile = window.matchMedia(MOBILE_QUERY);
    const reduced = window.matchMedia(REDUCED_MOTION_QUERY);
    const sync = () =>
      setSrc(reduced.matches ? null : mobile.matches ? MOBILE_VIDEO : WEB_VIDEO);

    mobile.addEventListener("change", sync);
    reduced.addEventListener("change", sync);
    return () => {
      mobile.removeEventListener("change", sync);
      reduced.removeEventListener("change", sync);
    };
  }, []);

  return src;
};

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
  const videoSrc = useHeroVideoSrc();
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Arka plan videosu — bilerek poster yok: acilista once gorsel, sonra
          video gecisi istenmiyor. Video gelene kadar zemin siyah kalir. */}
      <div className="absolute inset-0 bg-black">
        {videoSrc ? (
          <video
            key={videoSrc}
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src="/hero.webp"
            alt={t("home.hero.imageAlt")}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/60 to-transparent hidden md:block" />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/50 hidden md:block" />
        <div className="absolute inset-0 bg-black/60 md:hidden" />
      </div>

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-6 md:px-4 relative z-10 pt-20"
      >
        <div className="max-w-4xl text-center md:text-left">
          {/* Heading */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl leading-[1.15] md:text-6xl lg:text-7xl font-display font-bold text-white mb-5 md:mb-6"
          >
            {t("home.hero.titleLine1")}
            <span className="block text-gradient-brand">{t("home.hero.titleLine2")}</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={itemVariants}
            className="text-zinc-200 text-base md:text-xl max-w-md md:max-w-xl mx-auto md:mx-0 mb-8 md:mb-10"
          >
            {t("home.hero.description")}
          </motion.p>

          {/* Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap justify-center md:justify-start gap-3"
          >
            {/* İki ödeme yolu da paket kartlarından başlar; bu yüzden ana düğme paketlere iner */}
            <a href="#paketler" className={buttonClass("primary", "lg")}>
              {t("home.hero.packages")}
              <ArrowRight className="w-5 h-5" aria-hidden />
            </a>
            <LocalizedLink
              to="/rezervasyon"
              className={buttonClass("secondary", "lg", "bg-black/40")}
            >
              <Calendar className="w-5 h-5" aria-hidden />
              {t("home.hero.reservation")}
            </LocalizedLink>
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom fade — image dissolves into the next section (#09090b) */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-40 md:h-56 z-[5] bg-linear-to-b from-transparent to-[#09090b] pointer-events-none"
      />
    </section>
  );
};

export default Hero;
