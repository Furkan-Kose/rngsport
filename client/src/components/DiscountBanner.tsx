import { useState, useEffect } from "react";
import { Percent, Clock, Calendar } from "lucide-react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "framer-motion";

const TimeBlock = ({ value, label }: { value: number; label: string }) => {
  const display = value.toString().padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-12 h-14 sm:w-14 sm:h-16 md:w-16 md:h-20 bg-zinc-950/90 border border-zinc-800 rounded-lg overflow-hidden">
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
  const targetDate = new Date("2026-06-18T00:00:00").getTime();

  const calculateTimeLeft = () => {
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-12 relative overflow-hidden bg-black">
      {/* Single subtle ambient glow */}
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-64 bg-emerald-600/[0.04] rounded-full blur-3xl pointer-events-none"
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-zinc-950/80 backdrop-blur-sm border border-emerald-500/20 rounded-2xl p-6 md:p-8 lg:p-10 shadow-lg shadow-emerald-500/5">
            <div className="grid md:grid-cols-[1fr_auto] gap-8 md:gap-10 items-center">
              {/* Left: Info + CTA */}
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-4">
                  <Percent className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                    Özel Kampanya
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
                  Ön Rezervasyona{" "}
                  <span className="text-emerald-400">%20 İndirim</span>
                </h2>

                <p className="text-sm sm:text-base text-zinc-400 mb-6 max-w-md mx-auto md:mx-0">
                  Ön rezervasyon yaptırıp yarışma günü nakit ödeme yapan
                  sporcularımıza özel.
                </p>

                <Link
                  to="/rezervasyon"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                >
                  <Calendar className="w-4 h-4" />
                  Hemen Rezervasyon Yap
                </Link>

                <p className="text-[11px] text-zinc-600 mt-3">
                  * İndirim sadece ön rezervasyon + nakit ödeme için geçerlidir
                </p>
              </div>

              {/* Right: Countdown */}
              <div className="border-t md:border-t-0 md:border-l border-zinc-800 pt-6 md:pt-0 md:pl-10">
                <div className="flex items-center justify-center md:justify-start gap-1.5 text-zinc-500 text-xs mb-3">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="uppercase tracking-wider">
                    Kampanya bitimi
                  </span>
                </div>

                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <TimeBlock value={timeLeft.days} label="Gün" />
                  <span className="text-zinc-700 font-bold text-lg pb-4">:</span>
                  <TimeBlock value={timeLeft.hours} label="Saat" />
                  <span className="text-zinc-700 font-bold text-lg pb-4">:</span>
                  <TimeBlock value={timeLeft.minutes} label="Dk" />
                  <span className="text-zinc-700 font-bold text-lg pb-4">:</span>
                  <TimeBlock value={timeLeft.seconds} label="Sn" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DiscountBanner;
