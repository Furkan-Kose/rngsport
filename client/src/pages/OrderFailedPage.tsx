import { XCircle, ArrowLeft, RefreshCw, Phone } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import Reveal from "../components/ui/Reveal";

const OrderFailedPage = () => {
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error") || "Ödeme işlemi tamamlanamadı";
  const orderId = searchParams.get("id");

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] bg-red-600/[0.07] rounded-full blur-3xl" />
      </div>

      <div className="max-w-md w-full text-center relative z-10">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 16 }}
          className="relative w-24 h-24 mx-auto mb-6"
        >
          <div className="absolute inset-0 bg-red-500/30 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-full bg-red-500/15 border-2 border-red-500 flex items-center justify-center shadow-[0_0_36px_-4px_rgba(239,68,68,0.6)]">
            <XCircle className="w-12 h-12 text-red-400" />
          </div>
        </motion.div>

        <Reveal delay={0.15}>
          <h1 className="text-3xl font-bold text-white mb-3">
            Ödeme Başarısız
          </h1>
        </Reveal>

        <Reveal delay={0.22}>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </Reveal>

        <Reveal delay={0.3}>
          <p className="text-zinc-400 mb-8">
            Ödeme işleminiz tamamlanamadı. Kartınızdan herhangi bir tutar
            çekilmemiştir. Lütfen tekrar deneyin veya farklı bir ödeme yöntemi
            kullanın.
          </p>
        </Reveal>

        {orderId && (
          <p className="text-zinc-500 text-sm mb-6">
            Sipariş Referans:{" "}
            <span className="text-zinc-400 font-mono">{orderId}</span>
          </p>
        )}

        <Reveal delay={0.4}>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/sepet"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5"
            >
              <RefreshCw className="w-5 h-5" />
              Tekrar Dene
            </Link>
            <Link
              to="/"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-emerald-500/40 text-white rounded-xl font-medium transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              Ana Sayfa
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.5}>
          <div className="mt-10 pt-6 border-t border-zinc-800">
            <p className="text-zinc-500 text-sm mb-3">Sorun devam ederse</p>
            <a
              href="tel:+905398444521"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Phone className="w-4 h-4" />
              +90 (539) 844 45 21
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.55}>
          <div className="mt-8 text-left bg-zinc-900/60 rounded-xl p-5 border border-zinc-800">
            <h3 className="text-white font-semibold mb-3">Olası Nedenler</h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500/70">•</span>
                Kart limiti yetersiz olabilir
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500/70">•</span>
                Online alışveriş kapalı olabilir
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500/70">•</span>
                3D Secure doğrulaması başarısız olmuş olabilir
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500/70">•</span>
                Kart bilgileri hatalı girilmiş olabilir
              </li>
            </ul>
          </div>
        </Reveal>
      </div>
    </div>
  );
};

export default OrderFailedPage;
