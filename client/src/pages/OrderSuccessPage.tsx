import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { CheckCircle, Package, ArrowRight, Loader2 } from "lucide-react";
import api from "../lib/api";

interface OrderData {
  id: string;
  athleteName: string;
  clubName: string;
  totalPrice: number;
  items: Array<{ package: { name: string }; seriesCount: number; quantity: number }>;
}

const OrderSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("id");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      api.get(`/api/orders/${orderId}`)
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
    <div className="min-h-screen bg-zinc-950 pt-28 pb-16">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-lg mx-auto text-center">
          {loading ? (
            <div className="py-20">
              <Loader2 className="w-12 h-12 text-fuchsia-400 animate-spin mx-auto" />
            </div>
          ) : (
            <>
              <div className="relative mb-8 inline-block">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl scale-150" />
                <div className="relative w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-12 h-12 text-emerald-400" />
                </div>
              </div>

              <h1 className="text-3xl font-bold text-white mb-4">Ödeme Başarılı!</h1>
              <p className="text-zinc-400 mb-8">Siparişiniz başarıyla alındı. En kısa sürede sizinle iletişime geçeceğiz.</p>

              {order && (
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 mb-8 text-left">
                  <div className="flex items-center gap-3 mb-4">
                    <Package className="w-5 h-5 text-fuchsia-400" />
                    <span className="font-semibold text-white">Sipariş Detayları</span>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Sipariş No</span>
                      <span className="text-zinc-200 font-mono">#{order.id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Sporcu</span>
                      <span className="text-zinc-200">{order.athleteName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Kulüp</span>
                      <span className="text-zinc-200">{order.clubName}</span>
                    </div>

                    <div className="border-t border-zinc-800 pt-3 mt-3">
                      <p className="text-zinc-500 mb-2">Paketler</p>
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-zinc-300">
                          <span>
                            {item.package.name} ({item.seriesCount} Seri)
                          </span>
                          <span>x{item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-zinc-800 pt-3 mt-3">
                      <div className="flex justify-between">
                        <span className="text-zinc-400 font-medium">Toplam</span>
                        <span className="text-xl font-bold text-emerald-400">₺{order.totalPrice.toLocaleString("tr-TR")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Link
                to="/"
                className="inline-flex items-center gap-2 py-3 px-6 bg-linear-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white rounded-xl font-semibold transition-all duration-300"
              >
                Ana Sayfaya Dön
                <ArrowRight className="w-5 h-5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;

