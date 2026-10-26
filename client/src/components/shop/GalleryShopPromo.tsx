import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Gift, X } from "lucide-react";
import LocalizedLink from "../LocalizedLink";
import { PriceBadge } from "../Products";
import { useShowcase } from "../../hooks/useShowcase";
import type { ShowcaseItem } from "../../lib/shop";

// Galerim: satıştaki kişiye özel ürünler — sayfa üstünde şerit + bilgi popup'ı.
// Popup Galerim'e HER girişte açılır (kapatınca o ziyaret boyunca kapalı kalır).
// Satışta ürün yoksa hiçbiri görünmez.

const MiniCard = ({ item, onNavigate }: { item: ShowcaseItem; onNavigate?: () => void }) => (
  <LocalizedLink
    to={`/urunler/${item.slug}`}
    onClick={onNavigate}
    className="group flex gap-3 bg-zinc-900/70 border border-zinc-800 hover:border-emerald-500/40 rounded-xl p-3 transition-colors"
  >
    <img src={item.image} alt={item.imageAlt} loading="lazy" className="w-16 h-20 object-cover rounded-lg shrink-0" />
    <div className="min-w-0 flex flex-col">
      <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors leading-snug">{item.name}</p>
      {item.tagline && <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{item.tagline}</p>}
      <div className="mt-auto pt-1.5">{item.price ? <PriceBadge price={item.price} /> : null}</div>
    </div>
  </LocalizedLink>
);

const GalleryShopPromo = () => {
  const { t } = useTranslation();
  const { onSale, loaded } = useShowcase();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loaded || onSale.length === 0) return;
    const timer = setTimeout(() => setOpen(true), 900);
    return () => clearTimeout(timer);
  }, [loaded, onSale.length]);

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (onSale.length === 0) return null;

  return (
    <>
      {/* Şerit */}
      <section className="mb-8 rounded-2xl border border-emerald-500/30 bg-linear-to-r from-emerald-600/10 to-teal-600/10 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Gift className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">{t("pages.shop.promo.title")}</h2>
              <p className="text-sm text-zinc-400">{t("pages.shop.promo.text")}</p>
            </div>
          </div>
          <LocalizedLink to="/urunler" className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 hover:text-emerald-300">
            {t("pages.shop.promo.all")}
            <ArrowRight className="w-4 h-4" />
          </LocalizedLink>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {onSale.map((item) => (
            <MiniCard key={item.slug} item={item} />
          ))}
        </div>
      </section>

      {/* Bilgi popup'ı — her girişte */}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={close}
            >
              <motion.div
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 10 }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="shop-promo-title"
                className="relative w-full max-w-lg bg-zinc-950 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <button onClick={close} className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10" aria-label={t("pages.shop.promo.close")}>
                  <X className="w-5 h-5" />
                </button>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-4">
                  <Gift className="w-6 h-6 text-emerald-400" />
                </div>
                <h2 id="shop-promo-title" className="text-xl font-bold text-white mb-2">{t("pages.shop.promo.popupTitle")}</h2>
                <p className="text-sm text-zinc-400 mb-5">{t("pages.shop.promo.popupText")}</p>
                <div className="space-y-3 mb-6">
                  {onSale.map((item) => (
                    <MiniCard key={item.slug} item={item} onNavigate={close} />
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <LocalizedLink
                    to="/urunler"
                    onClick={close}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-semibold transition-colors"
                  >
                    {t("pages.shop.promo.cta")}
                    <ArrowRight className="w-4 h-4" />
                  </LocalizedLink>
                  <button onClick={close} className="flex-1 px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors">
                    {t("pages.shop.promo.later")}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default GalleryShopPromo;
