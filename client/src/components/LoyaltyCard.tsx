import { useState } from "react";
import { Star, ChevronDown } from "lucide-react";
import { POINT_TYPE_LABELS as TYPE_LABELS, type LoyaltySummary } from "../lib/loyalty";

// Profil: puan, seviye, sonraki seviyeye ilerleme ve puan geçmişi
const LoyaltyCard = ({ summary }: { summary: LoyaltySummary }) => {
  const [showHistory, setShowHistory] = useState(false);
  const { balance, tier, nextTier, pointsToNext, transactions } = summary;

  // İlerleme: mevcut seviyenin eşiğinden sonrakine
  const from = tier?.minPoints ?? 0;
  const to = nextTier?.minPoints ?? from;
  const progress = nextTier ? Math.min(100, ((balance - from) / (to - from)) * 100) : 100;

  return (
    <div className="relative bg-zinc-900/60 backdrop-blur-sm border border-amber-500/20 rounded-2xl p-6">
      <div className="absolute -top-px left-6 right-6 h-px bg-linear-to-r from-transparent via-amber-400/50 to-transparent" />
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <Star className="w-6 h-6 text-amber-400" fill="currentColor" />
          </div>
          <div>
            <p className="text-sm text-zinc-400">Sadakat Puanım</p>
            <p className="text-2xl font-bold text-white">{balance.toLocaleString("tr-TR")}</p>
          </div>
        </div>
        {tier ? (
          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-sm font-semibold">
              {tier.name}
            </span>
            <p className="text-xs text-zinc-400 mt-1">%{tier.discountPercent} indirim</p>
          </div>
        ) : (
          <span className="text-xs text-zinc-500">Henüz seviye yok</span>
        )}
      </div>

      {nextTier ? (
        <div className="mb-3">
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-amber-500 to-amber-300 transition-all duration-500"
              style={{ width: `${Math.max(2, progress)}%` }}
            />
          </div>
          <p className="text-xs text-zinc-400 mt-2">
            <strong className="text-amber-300">{nextTier.name}</strong> seviyesine (%{nextTier.discountPercent}{" "}
            indirim) {pointsToNext.toLocaleString("tr-TR")} puan kaldı.
          </p>
        </div>
      ) : (
        tier && <p className="text-xs text-amber-300/80 mb-3">En yüksek seviyedesiniz.</p>
      )}

      <p className="text-xs text-zinc-500">
        Puanlar ödemesi alınan her rezervasyon ve siparişte hesabınıza eklenir. Bir
        seviyeye ulaştığınızda sonraki alışverişinizde o seviyenin indirimi otomatik
        uygulanır ve seviyenin puanı harcanır; kalan puanınız birikmeye devam eder.
      </p>

      {transactions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showHistory ? "rotate-180" : ""}`} />
            Puan geçmişi
          </button>
          {showHistory && (
            <ul className="mt-3 space-y-2">
              {transactions.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-zinc-300 truncate">{t.note || TYPE_LABELS[t.type]}</p>
                    <p className="text-xs text-zinc-600">
                      {TYPE_LABELS[t.type]} ·{" "}
                      {new Date(t.createdAt).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span className={`font-semibold shrink-0 ${t.amount > 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {t.amount > 0 ? "+" : ""}
                    {t.amount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default LoyaltyCard;
