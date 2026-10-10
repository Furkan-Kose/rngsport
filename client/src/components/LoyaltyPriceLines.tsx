import { Link } from "react-router";
import { Star } from "lucide-react";
import { applyDiscount, formatTL } from "../lib/loyalty";

interface LoyaltyPriceLinesProps {
  subtotal: number;
  discountPercent: number;
  tierName?: string | null;
  // İndirim için harcanacak puan (seviyenin eşiği). Düzenlemede 0 — zaten harcandı.
  redeemPoints?: number;
  earnPoints: number;
  isGuest: boolean;
  loginRedirect: string;
}

// Rezervasyon formu ve sepetteki toplamın altında: seviye indirimi, kazanılacak
// puan, misafire giriş önerisi. Gösterim amaçlı — tutarı backend yeniden hesaplar.
const LoyaltyPriceLines = ({
  subtotal,
  discountPercent,
  tierName,
  redeemPoints = 0,
  earnPoints,
  isGuest,
  loginRedirect,
}: LoyaltyPriceLinesProps) => {
  const { discountAmount } = applyDiscount(subtotal, discountPercent);

  return (
    <div className="space-y-2 mb-4">
      {discountPercent > 0 && subtotal > 0 && (
        <>
          <div className="flex justify-between text-sm text-zinc-400">
            <span>Ara toplam</span>
            <span>{formatTL(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-amber-300">
            <span className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5" fill="currentColor" />
              {tierName ? `${tierName} indirimi` : "Seviye indirimi"} (%{discountPercent})
            </span>
            <span>−{formatTL(discountAmount)}</span>
          </div>
          {redeemPoints > 0 && (
            <p className="text-xs text-amber-300/80">
              Bu indirim için {redeemPoints} puanınız kullanılacak.
            </p>
          )}
        </>
      )}
      {earnPoints > 0 && (
        <p className="text-xs text-emerald-400/90">
          Bu alışverişten ödeme sonrası <strong>+{earnPoints} puan</strong> kazanacaksınız.
        </p>
      )}
      {isGuest && (
        <p className="text-xs text-zinc-500">
          <Link to={`/giris?redirect=${loginRedirect}`} className="text-emerald-400 hover:underline">
            Giriş yapın
          </Link>{" "}
          — sadakat seviyenizin indirimi uygulansın ve puanlarınızı takip edin.
        </p>
      )}
    </div>
  );
};

export default LoyaltyPriceLines;
