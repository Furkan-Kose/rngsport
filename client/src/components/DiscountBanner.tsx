import { useState, useEffect, useRef } from "react";
import { Calendar } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import LocalizedLink from "./LocalizedLink";
import Reveal from "./ui/Reveal";
import { buttonClass } from "../lib/siteUi";
import { useTournaments, type Tournament } from "../lib/tournaments";

const PROMO_VIDEO = "/baby_games.mp4";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const DESKTOP_QUERY = "(min-width: 768px)";

/**
 * Tanitim videosu yalnizca ekrandayken oynar.
 *
 * preload="none" + ilk gorunurlukte play(): 7 MB'lik dosya sayfa acilisinda
 * Hero videosuyla yarismaz. prefers-reduced-motion aciksa hic otomatik
 * oynatilmaz; kullanici kontrollerle kendisi baslatir.
 *
 * md+ ekranda ayni dosyanin bulanik bir kopyasi (ambient) tum section'in
 * arkasinda oynar; ayni URL oldugu icin tarayici onbellekten okur. Mobilde
 * ambient hic oynatilmaz (orada zaten asil video arka plan).
 */
const useInViewVideo = () => {
  const ref = useRef<HTMLVideoElement>(null);
  const ambientRef = useRef<HTMLVideoElement>(null);
  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia(REDUCED_MOTION_QUERY).matches,
  );

  useEffect(() => {
    const video = ref.current;
    if (!video || reduced) return;
    const desktop = window.matchMedia(DESKTOP_QUERY);

    const observer = new IntersectionObserver(
      ([entry]) => {
        const ambient = desktop.matches ? ambientRef.current : null;
        if (entry.isIntersecting) {
          // Autoplay engellenirse (dusuk guc modu vb.) sessizce ilk kare kalir
          video.play().catch(() => {});
          if (ambient) {
            ambient.currentTime = video.currentTime;
            ambient.play().catch(() => {});
          }
        } else {
          video.pause();
          ambientRef.current?.pause();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [reduced]);

  return { ref, ambientRef, reduced };
};

const TimeBlock = ({ value, label }: { value: number; label: string }) => {
  const display = value.toString().padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-12 h-14 sm:w-14 sm:h-16 md:w-16 md:h-20 bg-black/50 border border-zinc-800 rounded-lg overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={display}
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{
              duration: 0.45,
              ease: [0.25, 0.46, 0.45, 0.94] as const,
            }}
            className="absolute inset-0 flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-bold text-white font-mono tabular-nums"
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-xs text-zinc-400 mt-1.5">
        {label}
      </span>
    </div>
  );
};

// Geri sayım rezervasyona açık yarışmanın başlangıç tarihine (admin → Turnuvalar). Açık yarışma
// yoksa ya da tarihi geçtiyse bant hiç gösterilmez — artık koda tarih yazılmıyor.
const DiscountBanner = () => {
  const { open } = useTournaments();
  const [now] = useState(() => Date.now()); // sayfa açılış anı (render saf kalsın)
  const next = open.find((t) => t.startDate && Date.parse(t.startDate) > now);
  if (!next) return null;
  return <CountdownBanner key={next.id} tournament={next} />;
};

const CountdownBanner = ({ tournament }: { tournament: Tournament }) => {
  const { t } = useTranslation();
  const targetDate = Date.parse(tournament.startDate!);

  const calculateTimeLeft = () => {
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      ),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const { ref: videoRef, ambientRef, reduced } = useInViewVideo();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden bg-zinc-950 py-28 md:py-10">
      {/* Ambient arka plan (md+): ayni videonun buyutulmus, bulanik kopyasi
          tum section'i kapliyor — video "arka planda donuyor" hissi. Ust/alt
          kenarlar zinc-950'ye eriyor, Hero'dan kesintisiz gecis. */}
      <div
        aria-hidden
        className="absolute inset-0 hidden md:block pointer-events-none"
      >
        {!reduced && (
          <video
            ref={ambientRef}
            src={PROMO_VIDEO}
            muted
            loop
            playsInline
            preload="none"
            className="w-full h-full object-cover scale-125 blur-3xl opacity-45 saturate-150"
          />
        )}
        <div className="absolute inset-0 bg-zinc-950/50" />
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-zinc-950/40 to-zinc-950/85" />
        <div className="absolute inset-x-0 top-0 h-56 bg-linear-to-b from-zinc-950 via-zinc-950/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
      </div>

      {/* container/grid bilerek position'siz: mobilde video section'a gore
          absolute konumlanip tum arka plani kapliyor. */}
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-[auto_1fr] gap-12 lg:gap-20 xl:gap-28 items-center">
          {/* Video — mobilde section arka plani; md+ Header ile ayni container'in
              sol kenarindan (logo hizasi) basliyor,
              tam 9:16 (kirpilmadan). Cerceve yok, kenarlar maskeyle zinc-950'ye
              eriyor; Hero'nun alt fade'inden kesintisiz devam ediyor. */}
          <div
            aria-hidden={!reduced}
            className="absolute inset-0 md:relative md:inset-auto md:h-[min(94vh,940px)] md:aspect-[9/16] video-edge-fade"
          >
            <video
              ref={videoRef}
              src={PROMO_VIDEO}
              muted
              loop
              playsInline
              preload={reduced ? "metadata" : "none"}
              controls={reduced}
              className="w-full h-full object-cover"
            />
            {/* Hero ile ayni dil: mobilde duz karartma, md+ alttan hafif koyulasma */}
            <div className="absolute inset-0 bg-black/65 md:hidden pointer-events-none" />
            <div className="absolute inset-0 hidden md:block bg-linear-to-t from-black/45 via-black/5 to-black/20 pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-zinc-950 via-zinc-950/50 to-transparent pointer-events-none md:hidden" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-zinc-950 via-zinc-950/50 to-transparent pointer-events-none md:hidden" />
          </div>

          {/* Right: Info + Countdown + CTA */}
          <Reveal
            delay={0.15}
            className="relative z-10 text-center md:text-left"
          >
            <p className="text-emerald-400 text-sm sm:text-base font-semibold mb-3">{tournament.name}</p>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4 leading-tight">
              {t("home.discount.title")}
            </h2>

            <p className="text-base md:text-lg text-zinc-300 mb-8 max-w-xl mx-auto md:mx-0">
              {t("home.discount.description")}
            </p>

            <div className="mb-8">
              <p className="text-zinc-300 text-sm mb-3">
                {t("home.discount.date")}: {tournament.date}
              </p>

              <div className="flex items-center justify-center md:justify-start gap-1.5 sm:gap-2">
                <TimeBlock value={timeLeft.days} label={t("home.discount.days")} />
                <span className="text-zinc-700 font-bold text-lg pb-4">:</span>
                <TimeBlock value={timeLeft.hours} label={t("home.discount.hours")} />
                <span className="text-zinc-700 font-bold text-lg pb-4">:</span>
                <TimeBlock value={timeLeft.minutes} label={t("home.discount.minutes")} />
                <span className="text-zinc-700 font-bold text-lg pb-4">:</span>
                <TimeBlock value={timeLeft.seconds} label={t("home.discount.seconds")} />
              </div>
            </div>

            <LocalizedLink to="/rezervasyon" className={buttonClass("primary", "lg")}>
              <Calendar className="w-5 h-5" aria-hidden />
              {t("home.discount.cta")}
            </LocalizedLink>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default DiscountBanner;
