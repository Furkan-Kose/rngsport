import { useTranslation } from "react-i18next";
import LocalizedLink from "./LocalizedLink";
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
  const { t } = useTranslation();

  return (
    <div className="space-y-2 mb-4">
      {discountPercent > 0 && subtotal > 0 && (
        <>
          <div className="flex justify-between text-sm text-zinc-400">
            <span>{t("checkout.loyalty.subtotal")}</span>
            <span>{formatTL(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-amber-300">
            <span className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5" fill="currentColor" />
              {tierName ? t("checkout.loyalty.tierDiscount", { tier: tierName }) : t("checkout.loyalty.levelDiscount")} (%{discountPercent})
            </span>
            <span>−{formatTL(discountAmount)}</span>
          </div>
          {redeemPoints > 0 && (
            <p className="text-xs text-amber-300/80">
              {t("checkout.loyalty.redeem", { points: redeemPoints })}
            </p>
          )}
        </>
      )}
      {earnPoints > 0 && (
        <p className="text-xs text-emerald-400/90">
          {t("checkout.loyalty.earnBefore")}
          <strong>{t("checkout.loyalty.earnPoints", { points: earnPoints })}</strong>
          {t("checkout.loyalty.earnAfter")}
        </p>
      )}
      {isGuest && (
        <p className="text-xs text-zinc-500">
          <LocalizedLink to={`/giris?redirect=${loginRedirect}`} className="text-emerald-400 hover:underline">
            {t("checkout.loyalty.login")}
          </LocalizedLink>{" "}
          {t("checkout.loyalty.loginHint")}
        </p>
      )}
    </div>
  );
};

export default LoyaltyPriceLines;
