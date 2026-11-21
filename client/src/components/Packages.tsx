import { useState, useEffect, useCallback } from "react";
import { Check, Camera, Video, CalendarCheck, CreditCard, Layers } from "lucide-react";
import { useCart, type Package } from "../context/CartContext";
import api from "../lib/api";
import { useTranslation } from "react-i18next";

import SectionHeader from "./ui/SectionHeader";
import Reveal from "./ui/Reveal";
import LocalizedLink from "./LocalizedLink";
import { Alert, Button, Chip, Pill, Skeleton } from "./ui/kit";
import { useTournaments } from "../lib/tournaments";
import { useLocalizedNavigate } from "../lib/localePath";
import { formatTL } from "../lib/loyalty";
import { STAGGER } from "../lib/motion";
import { buttonClass, cardClass, cardTone, cx } from "../lib/siteUi";

export type PackageCategory = "photo" | "video" | "full";
export type { Package };

const CATEGORY_ICONS = { photo: Camera, video: Video, full: Layers };

type Series = 1 | 2 | 3;
const seriesOptions: Series[] = [1, 2, 3];

interface PackageCardProps {
  pkg: Package;
  /** Komple paket: yeşil çerçeve (düzeni diğer kartlarla aynı) */
  featured?: boolean;
  /** Rezervasyona açık yarışma var mı (yoksa düğmeler pasif) */
  bookingOpen: boolean;
}

/**
 * Paket kartı: görsel → ad → seri seçici → özellikler → iki düğme.
 * İki düğme iki ödeme yoludur (açıklaması bölümün üstündeki iki kutuda):
 *  - "Rezervasyon yap": yer ayırtılır, ödeme yarışma günü stantta (rezervasyon fiyatı)
 *  - "Online öde": sepete eklenip sepete gidilir, kartla ödenir (online fiyat)
 * Fiyatlar yalnızca gösterim içindir; sunucu her kaydı veritabanından fiyatlar.
 */
const PackageCard = ({ pkg, featured = false, bookingOpen }: PackageCardProps) => {
  const { addToCart, isInCart } = useCart();
  const { t } = useTranslation();
  const navigate = useLocalizedNavigate();
  const inCart = isInCart(pkg.id);
  const [series, setSeries] = useState<Series>(1);

  const onlinePrice = series === 1 ? pkg.price : pkg.discounts[series];
  // Eski önbellekte rezervasyon fiyatı yoksa online fiyata düşer (API de böyle yapar)
  const reservationPrice =
    series === 1
      ? (pkg.reservationPrice ?? pkg.price)
      : (pkg.reservationDiscounts?.[series] ?? pkg.discounts[series]);

  const discountFor = (n: Series) =>
    n === 1 ? 0 : Math.round((1 - pkg.discounts[n] / (pkg.price * n)) * 100);

  const CategoryIcon = CATEGORY_ICONS[pkg.category];

  const payOnline = () => {
    addToCart(pkg, series);
    navigate("/sepet");
  };

  return (
    <article className={cx(cardTone(featured ? "accent" : "default"), "group h-full flex flex-col overflow-hidden")}>
      <div className="relative h-40 overflow-hidden shrink-0">
        <img
          src={pkg.image}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-zinc-900 via-zinc-900/20 to-transparent" />
        <Pill tone="neutral" icon={CategoryIcon} className="absolute top-3 left-3 bg-zinc-950/80">
          {featured ? t("home.packages.featuredTag") : t(`common.category.${pkg.category}`)}
        </Pill>
        {inCart && (
          <Pill tone="success" icon={Check} className="absolute top-3 right-3 bg-zinc-950/80">
            {t("home.packages.inCart")}
          </Pill>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-semibold text-zinc-100 mb-4">{pkg.name}</h3>

        {/* Seri seçimi: iki düğmedeki fiyat seçilen seriye göre değişir */}
        <div role="group" aria-label={t("checkout.reservation.seriesCount")} className="grid grid-cols-3 gap-2 mb-5">
          {seriesOptions.map((n) => (
            <Chip
              key={n}
              active={series === n}
              onClick={() => setSeries(n)}
              className="flex-col gap-0 py-1.5 px-1"
            >
              <span>{t("common.series", { count: n })}</span>
              {discountFor(n) > 0 && (
                <span className="text-xs font-normal opacity-80">
                  {t("home.packages.discount", { percent: discountFor(n) })}
                </span>
              )}
            </Chip>
          ))}
        </div>

        <ul className="space-y-2 mb-5 flex-1">
          {pkg.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-zinc-300">
              <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" aria-hidden />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="space-y-2">
          {bookingOpen ? (
            <LocalizedLink
              to={`/rezervasyon?paket=${encodeURIComponent(pkg.id)}&seri=${series}`}
              className={buttonClass("primary", "lg", "w-full justify-between")}
            >
              <span className="inline-flex items-center gap-2">
                <CalendarCheck className="w-4 h-4" aria-hidden />
                {t("home.packages.reserve")}
              </span>
              <span>{formatTL(reservationPrice)}</span>
            </LocalizedLink>
          ) : (
            <Button size="lg" disabled className="w-full justify-between">
              <span className="inline-flex items-center gap-2">
                <CalendarCheck className="w-4 h-4" aria-hidden />
                {t("home.packages.reserve")}
              </span>
              <span>{formatTL(reservationPrice)}</span>
            </Button>
          )}

          <Button
            variant="secondary"
            size="lg"
            disabled={!bookingOpen}
            onClick={payOnline}
            className="w-full justify-between"
          >
            <span className="inline-flex items-center gap-2">
              <CreditCard className="w-4 h-4" aria-hidden />
              {t("home.packages.payOnline")}
            </span>
            <span>{formatTL(onlinePrice)}</span>
          </Button>
        </div>
      </div>
    </article>
  );
};

// Sutun sayisi paket sayisindan turetilir; aksi halde eksik satirda bos sutun kaliyor
// (ornegin bir paket kaldirilinca). Tailwind dinamik sinif adi taramadigi icin sabit tablo.
const GRID_BY_COUNT: Record<number, string> = {
  1: "md:grid-cols-1 max-w-sm",
  2: "md:grid-cols-2 max-w-3xl",
  3: "md:grid-cols-3 max-w-5xl",
  4: "md:grid-cols-2 xl:grid-cols-4 max-w-3xl xl:max-w-7xl", // 2x2, genis ekranda tek sira
};

const gridClassFor = (count: number) =>
  count >= 5 ? GRID_BY_COUNT[3] : GRID_BY_COUNT[Math.max(count, 1)];

/** hideHeader: sayfa başlığı zaten varsa (/paketler) bölüm başlığı gösterilmez */
const Packages = ({ hideHeader = false }: { hideHeader?: boolean }) => {
  const { t, i18n } = useTranslation();
  const { open, loading: tournamentsLoading } = useTournaments();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await api.get("/api/packages");
      setPackages(data);
    } catch (err) {
      setError(true);
      console.error("Paketler yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Paket adları/özellikleri sunucudan dile göre gelir
  useEffect(() => {
    fetchPackages();
  }, [fetchPackages, i18n.language]);

  // Yarışma listesi gelene kadar düğmeleri pasif göstermeyelim
  const bookingOpen = tournamentsLoading || open.length > 0;

  // Komple paket üstte tek başına (yeşil çerçeveli); diğerleri (önce fotoğraf, sonra video) altında
  const fullPackage = packages.find((p) => p.category === "full");
  const otherPackages = [
    ...packages.filter((p) => p.category === "photo"),
    ...packages.filter((p) => p.category === "video"),
  ];

  return (
    <section
      id="paketler"
      className={cx("bg-zinc-950 scroll-mt-20", hideHeader ? "pb-24" : "py-24")}
    >
      <div className="container mx-auto px-4">
        {!hideHeader && (
          <SectionHeader title={t("home.packages.title")} description={t("home.packages.description")} />
        )}

        {/* İki ödeme yolu — kartlardaki iki düğmenin açıklaması */}
        <Reveal className="grid sm:grid-cols-2 gap-4 max-w-4xl mx-auto mb-12">
          <div className={cx(cardClass, "p-5 flex gap-4")}>
            <CalendarCheck className="w-6 h-6 text-emerald-400 shrink-0" aria-hidden />
            <div>
              <h3 className="font-semibold text-zinc-100">{t("home.packages.wayReserveTitle")}</h3>
              <p className="mt-1 text-sm text-zinc-400">{t("home.packages.wayReserveText")}</p>
            </div>
          </div>
          <div className={cx(cardClass, "p-5 flex gap-4")}>
            <CreditCard className="w-6 h-6 text-emerald-400 shrink-0" aria-hidden />
            <div>
              <h3 className="font-semibold text-zinc-100">{t("home.packages.wayOnlineTitle")}</h3>
              <p className="mt-1 text-sm text-zinc-400">{t("home.packages.wayOnlineText")}</p>
            </div>
          </div>
        </Reveal>

        {!bookingOpen && (
          <Alert tone="warning" className="max-w-4xl mx-auto mb-8">
            {t("home.packages.closedNotice")}
          </Alert>
        )}

        {loading ? (
          <div className="space-y-8">
            <Skeleton className="h-[30rem] rounded-2xl mx-auto w-full max-w-sm" />
            <div className={`grid grid-cols-1 gap-6 mx-auto w-full ${GRID_BY_COUNT[3]}`}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-[30rem] rounded-2xl" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto text-center">
            <Alert tone="danger" className="text-left mb-4">
              {t("home.packages.loadError")}
            </Alert>
            <Button variant="secondary" onClick={fetchPackages}>
              {t("common.retry")}
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {fullPackage && (
              <Reveal className="mx-auto w-full max-w-sm">
                <PackageCard pkg={fullPackage} featured bookingOpen={bookingOpen} />
              </Reveal>
            )}

            {otherPackages.length > 0 && (
              <div
                className={`grid grid-cols-1 gap-6 items-stretch mx-auto w-full ${gridClassFor(otherPackages.length)}`}
              >
                {otherPackages.map((pkg, i) => (
                  <Reveal key={pkg.id} delay={i * STAGGER} className="h-full mx-auto w-full max-w-sm md:max-w-none">
                    <PackageCard pkg={pkg} bookingOpen={bookingOpen} />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default Packages;
