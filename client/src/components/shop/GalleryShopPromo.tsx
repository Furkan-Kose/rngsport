import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import Modal from "../ui/Modal";
import { Button } from "../ui/kit";
import { buttonClass, cardClass, cx, innerRowClass, textLinkClass } from "../../lib/siteUi";
import LocalizedLink from "../LocalizedLink";
import { PriceBadge } from "../Products";
import { useShowcase } from "../../hooks/useShowcase";
import type { ShowcaseItem } from "../../lib/shop";

// Galerim: satıştaki kişiye özel ürünler — sayfa üstünde şerit + bilgi popup'ı.
// Popup Galerim'e HER girişte açılır (kapatınca o ziyaret boyunca kapalı kalır) — bilinçli
// karar, tek seferlik yapılmasın.
// Satışta ürün yoksa hiçbiri görünmez.

const MiniCard = ({ item, onNavigate }: { item: ShowcaseItem; onNavigate?: () => void }) => (
  <LocalizedLink
    to={`/urunler/${item.slug}`}
    onClick={onNavigate}
    className={cx(innerRowClass, "group flex gap-3 p-3 hover:border-zinc-500 transition-colors")}
  >
    <img src={item.image} alt={item.imageAlt} loading="lazy" className="w-16 h-20 object-cover rounded-lg shrink-0" />
    <div className="min-w-0 flex flex-col">
      <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors leading-snug">{item.name}</p>
      {item.tagline && <p className="text-sm text-zinc-400 mt-0.5 line-clamp-2">{item.tagline}</p>}
      <div className="mt-auto pt-1.5">{item.price ? <PriceBadge price={item.price} /> : null}</div>
    </div>
  </LocalizedLink>
);

// withPopup=false: admin önizlemesinde popup kontrolü engellemesin (şerit kalır)
const GalleryShopPromo = ({ withPopup = true }: { withPopup?: boolean }) => {
  const { t } = useTranslation();
  const { onSale, loaded } = useShowcase();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!withPopup || !loaded || onSale.length === 0) return;
    const timer = setTimeout(() => setOpen(true), 900);
    return () => clearTimeout(timer);
  }, [withPopup, loaded, onSale.length]);

  const close = () => setOpen(false);

  if (onSale.length === 0) return null;

  return (
    <>
      {/* Şerit */}
      <section className={cx(cardClass, "mb-8 p-5")}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-semibold text-white">{t("pages.shop.promo.title")}</h2>
            <p className="text-sm text-zinc-400">{t("pages.shop.promo.text")}</p>
          </div>
          <LocalizedLink to="/urunler" className={cx(textLinkClass, "text-emerald-400 hover:text-emerald-300")}>
            {t("pages.shop.promo.all")}
            <ArrowRight className="w-4 h-4" aria-hidden />
          </LocalizedLink>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {onSale.map((item) => (
            <MiniCard key={item.slug} item={item} />
          ))}
        </div>
      </section>

      {/* Bilgi popup'ı — her girişte */}
      <Modal
        open={open}
        onClose={close}
        title={t("pages.shop.promo.popupTitle")}
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              {t("pages.shop.promo.later")}
            </Button>
            <LocalizedLink to="/urunler" onClick={close} className={buttonClass("primary")}>
              {t("pages.shop.promo.cta")}
              <ArrowRight className="w-4 h-4" aria-hidden />
            </LocalizedLink>
          </>
        }
      >
        <p className="text-zinc-400 mb-5">{t("pages.shop.promo.popupText")}</p>
        <div className="space-y-3">
          {onSale.map((item) => (
            <MiniCard key={item.slug} item={item} onNavigate={close} />
          ))}
        </div>
      </Modal>
    </>
  );
};

export default GalleryShopPromo;
