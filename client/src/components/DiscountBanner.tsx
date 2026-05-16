import { useState, useEffect } from "react";
import { Percent, Clock, Calendar } from "lucide-react";
import { Link } from "react-router";

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

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-zinc-900/80 backdrop-blur-sm border border-emerald-500/30 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <span className="text-2xl sm:text-4xl lg:text-6xl font-bold text-white font-mono">
            {value.toString().padStart(2, "0")}
          </span>
        </div>
        <div className="hidden sm:block absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
      </div>
      <span className="text-xs sm:text-sm lg:text-lg text-zinc-400 mt-2 sm:mt-3 font-medium">{label}</span>
    </div>
  );

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-linear-to-b from-black/50 via-emerald-950/20 to-black/50" />
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="mx-auto">
          {/* Main Card */}
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-6 sm:p-10 lg:p-16 text-center shadow-2xl shadow-emerald-500/5">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full mb-6 lg:mb-8">
              <Percent className="w-4 h-4 text-emerald-400" />
              <span className="text-sm lg:text-base font-semibold text-emerald-300">Özel Kampanya</span>
            </div>

            {/* Discount Text */}
            <h2 className="text-2xl sm:text-4xl lg:text-6xl font-bold text-white mb-4 lg:mb-6 leading-tight">
              Ön Rezervasyon Yapanlara{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-violet-400">
                %20 İndirim!
              </span>
            </h2>
            
            <p className="text-zinc-400 text-sm sm:text-lg lg:text-xl max-w-3xl mx-auto mb-8 lg:mb-12">
              Ön rezervasyon yaptırıp yarışma günü nakit ödeme yapan sporcularımıza özel indirim fırsatı. Bu fırsatı kaçırmayın!
            </p>

            {/* Countdown */}
            <div className="mb-8 lg:mb-12 w-full">
              <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm lg:text-base mb-4 lg:mb-6">
                <Clock className="w-4 h-4 lg:w-5 lg:h-5" />
                <span>Kampanya bitimine kalan süre</span>
              </div>
              
              <div className="flex items-center justify-center gap-2 sm:gap-4 lg:gap-8">
                <TimeBlock value={timeLeft.days} label="Gün" />
                <div className="text-lg sm:text-2xl lg:text-5xl text-emerald-500/50 font-bold self-start mt-5 sm:mt-7 lg:mt-10">:</div>
                <TimeBlock value={timeLeft.hours} label="Saat" />
                <div className="text-lg sm:text-2xl lg:text-5xl text-emerald-500/50 font-bold self-start mt-5 sm:mt-7 lg:mt-10">:</div>
                <TimeBlock value={timeLeft.minutes} label="Dakika" />
                <div className="text-lg sm:text-2xl lg:text-5xl text-emerald-500/50 font-bold self-start mt-5 sm:mt-7 lg:mt-10">:</div>
                <TimeBlock value={timeLeft.seconds} label="Saniye" />
              </div>
            </div>

            {/* CTA Button */}
            <Link
              to="/rezervasyon"
              className="inline-flex items-center gap-2 px-8 py-4 lg:px-12 lg:py-5 bg-linear-to-r from-emerald-500 to-violet-500 hover:from-emerald-600 hover:to-violet-600 text-white rounded-xl lg:rounded-2xl font-semibold lg:text-lg transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
            >
              <Calendar className="w-5 h-5 lg:w-6 lg:h-6" />
              Hemen Rezervasyon Yap
            </Link>

            {/* Note */}
            <p className="text-xs lg:text-sm text-zinc-500 mt-6 lg:mt-8">
              * İndirim sadece ön rezervasyon + nakit ödeme için geçerlidir
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DiscountBanner;
