import { XCircle, ArrowLeft, RefreshCw, Phone } from "lucide-react";
import { Link, useSearchParams } from "react-router";

const OrderFailedPage = () => {
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error") || "Ödeme işlemi tamamlanamadı";
  const orderId = searchParams.get("id");

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="w-24 h-24 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-red-500" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-3">
          Ödeme Başarısız
        </h1>

        {/* Error Message */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <p className="text-red-400 text-sm">
            {error}
          </p>
        </div>

        {/* Info */}
        <p className="text-zinc-400 mb-8">
          Ödeme işleminiz tamamlanamadı. Kartınızdan herhangi bir tutar çekilmemiştir. 
          Lütfen tekrar deneyin veya farklı bir ödeme yöntemi kullanın.
        </p>

        {/* Order ID if exists */}
        {orderId && (
          <p className="text-zinc-500 text-sm mb-6">
            Sipariş Referans: <span className="text-zinc-400 font-mono">{orderId}</span>
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/cart"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-fuchsia-500 hover:bg-fuchsia-600 text-white rounded-xl font-medium transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Tekrar Dene
          </Link>
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Ana Sayfa
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-10 pt-6 border-t border-zinc-800">
          <p className="text-zinc-500 text-sm mb-3">Sorun devam ederse</p>
          <a 
            href="tel:+905551234567" 
            className="inline-flex items-center gap-2 text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
          >
            <Phone className="w-4 h-4" />
            +90 (555) 123 45 67
          </a>
        </div>

        {/* Common Issues */}
        <div className="mt-8 text-left bg-zinc-900/50 rounded-xl p-5 border border-zinc-800">
          <h3 className="text-white font-semibold mb-3">Olası Nedenler</h3>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex items-start gap-2">
              <span className="text-zinc-600">•</span>
              Kart limiti yetersiz olabilir
            </li>
            <li className="flex items-start gap-2">
              <span className="text-zinc-600">•</span>
              Online alışveriş kapalı olabilir
            </li>
            <li className="flex items-start gap-2">
              <span className="text-zinc-600">•</span>
              3D Secure doğrulaması başarısız olmuş olabilir
            </li>
            <li className="flex items-start gap-2">
              <span className="text-zinc-600">•</span>
              Kart bilgileri hatalı girilmiş olabilir
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OrderFailedPage;
