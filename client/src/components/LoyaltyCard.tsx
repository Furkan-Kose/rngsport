import { useState } from "react";
import { Star, ChevronDown } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { type LoyaltySummary, type PointTransaction } from "../lib/loyalty";
import { formatDate, formatNumber } from "../lib/format";
import { Card, Pill } from "./ui/kit";

// Profil: puan, seviye, sonraki seviyeye ilerleme ve puan geçmişi
const LoyaltyCard = ({ summary }: { summary: LoyaltySummary }) => {
  const [showHistory, setShowHistory] = useState(false);
  const { balance, tier, nextTier, pointsToNext, transactions } = summary;
  const { t, i18n } = useTranslation();
  const typeLabel = (type: PointTransaction["type"]) => t(`account.loyalty.types.${type}`);

  // Hareket notları sunucuda Türkçe kaydediliyor ("Ada — Gümüş indirimi (%10)").
  // Diğer dillerde sporcu adı korunur, açıklama hareket türüyle değiştirilir;
  // admin düzeltmelerinin serbest notu olduğu gibi kalır.
  const noteFor = (tx: PointTransaction) => {
    if (!tx.note) return typeLabel(tx.type);
    if (i18n.language === "tr" || tx.type === "ADJUST") return tx.note;
    const sep = tx.note.indexOf(" — ");
    return sep > 0 ? `${tx.note.slice(0, sep)} — ${typeLabel(tx.type)}` : typeLabel(tx.type);
  };

  // İlerleme: mevcut seviyenin eşiğinden sonrakine
  const from = tier?.minPoints ?? 0;
  const to = nextTier?.minPoints ?? from;
  const progress = nextTier ? Math.min(100, ((balance - from) / (to - from)) * 100) : 100;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Star className="w-7 h-7 text-amber-400 shrink-0" fill="currentColor" aria-hidden />
          <div>
            <h2 className="text-sm text-zinc-400">{t("account.loyalty.title")}</h2>
            <p className="text-2xl font-bold text-white">{formatNumber(balance)}</p>
          </div>
        </div>
        {tier ? (
          <div className="text-right">
            <Pill tone="warning" className="text-sm">
              {tier.name}
            </Pill>
            <p className="text-sm text-zinc-400 mt-1">{t("account.loyalty.discount", { percent: tier.discountPercent })}</p>
          </div>
        ) : (
          <span className="text-sm text-zinc-400">{t("account.loyalty.noTier")}</span>
        )}
      </div>

      {nextTier ? (
        <div className="mb-3">
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(2, progress)}%` }}
            />
          </div>
          <p className="text-sm text-zinc-300 mt-2">
            <Trans
              i18nKey="account.loyalty.next"
              values={{
                tier: nextTier.name,
                percent: nextTier.discountPercent,
                points: formatNumber(pointsToNext),
              }}
              components={{ 1: <strong className="text-amber-300" /> }}
            />
          </p>
        </div>
      ) : (
        tier && <p className="text-sm text-amber-300 mb-3">{t("account.loyalty.top")}</p>
      )}

      <p className="text-sm text-zinc-400">
        {t("account.loyalty.explain")}
      </p>

      {transactions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <button
            type="button"
            aria-expanded={showHistory}
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-1.5 min-h-10 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showHistory ? "rotate-180" : ""}`} />
            {t("account.loyalty.history")}
          </button>
          {showHistory && (
            <ul className="mt-3 space-y-2">
              {transactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-zinc-300 truncate">{noteFor(tx)}</p>
                    <p className="text-zinc-400">
                      {typeLabel(tx.type)} ·{" "}
                      {formatDate(tx.createdAt, { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <span className={`font-semibold shrink-0 ${tx.amount > 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {tx.amount > 0 ? "+" : ""}
                    {tx.amount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
};

export default LoyaltyCard;
