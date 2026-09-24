import { useState, useEffect, useRef } from "react";
import { Clock, Calendar, CalendarCheck } from "lucide-react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import Reveal from "./ui/Reveal";

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
      <div className="relative w-12 h-14 sm:w-14 sm:h-16 md:w-16 md:h-20 bg-black/50 backdrop-blur-sm border border-zinc-800 rounded-lg overflow-hidden">
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
      <span className="text-[10px] sm:text-xs text-zinc-500 mt-1.5 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
};

const DiscountBanner = () => {
  const targetDate = new Date("2026-10-22T00:00:00").getTime();

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

      {/* Metin tarafinda Hero'daki gibi cok hafif izgara */}
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 w-1/2 bg-grid-dark opacity-40 pointer-events-none hidden md:block"
      />

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
            <div className="inline-flex items-center gap-2 text-emerald-400 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] mb-4">
              <CalendarCheck className="w-4 h-4" />
              Yaklaşan Yarışma
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4 leading-tight">
              Yarışma Gününe Özel %15 İndirim
            </h2>

            <p className="text-sm sm:text-base md:text-lg text-zinc-300 md:text-zinc-400 mb-8 max-w-xl mx-auto md:mx-0">
              Ön rezervasyonunuzu oluşturun, çekim planımıza önceden dahil olun.
              Yarışma günü standımızda ödemenizi tamamlayın; nakit ödemelerde
              %15 indirimden yararlanın.
            </p>

            <div className="mb-8">
              <div className="flex items-center justify-center md:justify-start gap-1.5 text-zinc-500 text-xs mb-3">
                <Clock className="w-3.5 h-3.5" />
                <span className="uppercase tracking-wider">Yarışma Tarihi</span>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-1.5 sm:gap-2">
                <TimeBlock value={timeLeft.days} label="Gün" />
                <span className="text-zinc-700 font-bold text-lg pb-4">:</span>
                <TimeBlock value={timeLeft.hours} label="Saat" />
                <span className="text-zinc-700 font-bold text-lg pb-4">:</span>
                <TimeBlock value={timeLeft.minutes} label="Dk" />
                <span className="text-zinc-700 font-bold text-lg pb-4">:</span>
                <TimeBlock value={timeLeft.seconds} label="Sn" />
              </div>
            </div>

            <Link
              to="/rezervasyon"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5"
            >
              <Calendar className="w-4 h-4" />
              Hemen Rezervasyon Yap
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default DiscountBanner;

// <section className="py-12 relative overflow-hidden bg-black">
//   {/* Single subtle ambient glow */}
//   <div
//     aria-hidden
//     className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-64 bg-emerald-600/[0.04] rounded-full blur-3xl pointer-events-none"
//   />

//   <div className="container mx-auto px-4 relative z-10">
//     <div className="max-w-5xl mx-auto">
//       <div className="relative bg-zinc-950/80 backdrop-blur-sm border border-emerald-500/20 rounded-2xl p-6 md:p-8 lg:p-10 shadow-lg shadow-emerald-500/5">
//         <div className="grid md:grid-cols-[1fr_auto] gap-8 md:gap-10 items-center">
//           {/* Left: Info + CTA */}
//           <div className="text-center md:text-left">
//             <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-4">
//               <Percent className="w-3.5 h-3.5 text-emerald-400" />
//               <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
//                 Özel Kampanya
//               </span>
//             </div>

//             <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
//               Ön Rezervasyona{" "}
//               <span className="text-emerald-400">%20 İndirim</span>
//             </h2>

//             <p className="text-sm sm:text-base text-zinc-400 mb-6 max-w-md mx-auto md:mx-0">
//               Ön rezervasyon yaptırıp yarışma günü nakit ödeme yapan
//               sporcularımıza özel.
//             </p>

//             <Link
//               to="/rezervasyon"
//               className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
//             >
//               <Calendar className="w-4 h-4" />
//               Hemen Rezervasyon Yap
//             </Link>

//             <p className="text-[11px] text-zinc-600 mt-3">
//               * İndirim sadece ön rezervasyon + nakit ödeme için geçerlidir
//             </p>
//           </div>

//           {/* Right: Countdown */}
//           <div className="border-t md:border-t-0 md:border-l border-zinc-800 pt-6 md:pt-0 md:pl-10">
//             <div className="flex items-center justify-center md:justify-start gap-1.5 text-zinc-500 text-xs mb-3">
//               <Clock className="w-3.5 h-3.5" />
//               <span className="uppercase tracking-wider">
//                 Kampanya bitimi
//               </span>
//             </div>

//             <div className="flex items-center justify-center gap-1.5 sm:gap-2">
//               <TimeBlock value={timeLeft.days} label="Gün" />
//               <span className="text-zinc-700 font-bold text-lg pb-4">:</span>
//               <TimeBlock value={timeLeft.hours} label="Saat" />
//               <span className="text-zinc-700 font-bold text-lg pb-4">:</span>
//               <TimeBlock value={timeLeft.minutes} label="Dk" />
//               <span className="text-zinc-700 font-bold text-lg pb-4">:</span>
//               <TimeBlock value={timeLeft.seconds} label="Sn" />
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   </div>
// </section>
