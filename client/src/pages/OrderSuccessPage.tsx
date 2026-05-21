import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { CheckCircle, Package, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import api from "../lib/api";
import Reveal from "../components/ui/Reveal";

interface OrderData {
  id: string;
  athleteName: string;
  clubName: string;
  totalPrice: number;
  items: Array<{
    package: { name: string };
    seriesCount: number;
    quantity: number;
  }>;
}

const OrderSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("id");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      api
        .get(`/api/orders/${orderId}`)
        .then(({ data }) => {
          setOrder(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [orderId]);

  return (
    <div className="min-h-screen bg-zinc-950 pt-28 pb-16 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] bg-emerald-600/[0.07] rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-lg mx-auto text-center">
          {loading ? (
            <div className="py-20">
              <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto" />
            </div>
          ) : (
            <>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 180,
                  damping: 16,
                  delay: 0.1,
                }}
                className="relative mb-8 inline-block"
              >
                <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-2xl scale-150 animate-pulse" />
                <div className="relative w-28 h-28 rounded-full bg-emerald-500/15 border-2 border-emerald-500 flex items-center justify-center mx-auto shadow-[0_0_40px_-4px_rgba(16,185,129,0.7)]">
                  <CheckCircle className="w-14 h-14 text-emerald-400" />
                </div>
              </motion.div>

              <Reveal delay={0.2}>
                <h1 className="text-4xl font-bold text-gradient-brand mb-4">
                  Ödeme Başarılı!
                </h1>
              </Reveal>
              <Reveal delay={0.3}>
                <p className="text-zinc-400 mb-8 text-lg">
                  Siparişiniz başarıyla alındı. En kısa sürede sizinle iletişime
                  geçeceğiz.
                </p>
              </Reveal>

              {order && (
                <Reveal delay={0.4}>
                  <div className="relative rounded-2xl p-px bg-linear-to-br from-emerald-500/40 via-zinc-700/20 to-emerald-500/40 mb-8 overflow-hidden">
                    <div className="relative bg-zinc-950 rounded-2xl p-6 text-left">
                      <div className="flex items-center gap-3 mb-4">
                        <Package className="w-5 h-5 text-emerald-400" />
                        <span className="font-semibold text-white">
                          Sipariş Detayları
                        </span>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Sipariş No</span>
                          <span className="text-zinc-200 font-mono">
                            #{order.id.slice(-8).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Sporcu</span>
                          <span className="text-zinc-200">
                            {order.athleteName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Kulüp</span>
                          <span className="text-zinc-200">
                            {order.clubName}
                          </span>
                        </div>

                        <div className="border-t border-zinc-800 pt-3 mt-3">
                          <p className="text-zinc-500 mb-2">Paketler</p>
                          {order.items.map((item, i) => (
                            <div
                              key={i}
                              className="flex justify-between text-zinc-300"
                            >
                              <span>
                                {item.package.name} ({item.seriesCount} Seri)
                              </span>
                              <span>x{item.quantity}</span>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-zinc-800 pt-3 mt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-400 font-medium">
                              Toplam
                            </span>
                            <span className="text-xl font-bold text-gradient-brand">
                              ₺{order.totalPrice.toLocaleString("tr-TR")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              )}

              <Reveal delay={0.5}>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 py-3 px-6 bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 group"
                >
                  Ana Sayfaya Dön
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Reveal>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
