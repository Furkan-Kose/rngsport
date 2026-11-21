import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import LocalizedLink from "../components/LocalizedLink";
import { Check, Clock } from "lucide-react";
import api from "../lib/api";
import SEO from "../components/SEO";
import AccountClaimCard, { type AccountInfo } from "../components/AccountClaimCard";
import { useCart } from "../context/CartContext";
import PriorityBadge from "../components/PriorityBadge";
import { Alert, Card, Spinner } from "../components/ui/kit";
import { formatTL } from "../lib/loyalty";
import { buttonClass, containerClass, cx, innerRowClass, pageClass, widthForm } from "../lib/siteUi";

interface OrderData {
  id: string;
  /** Şifre belirleme kartı için hesap durumu (backend: claimStatusFor) */
  account?: AccountInfo;
  status: string;
  athleteName: string;
  clubName: string;
  totalPrice: number;
  tournament?: { name: string } | null; // hangi yarışma için
  items: Array<{
    package: { name: string };
    seriesCount: number;
    quantity: number;
    priority?: boolean;
  }>;
}

// Ödemesi alınmış sayılan durumlar (teslim edilen sipariş de ödenmiştir)
const PAID_STATUSES = ["PAID", "DELIVERED"];

const OrderSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("id");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const { clearCart } = useCart();
  const { t } = useTranslation();

  useEffect(() => {
    if (orderId) {
      api
        .get(`/api/orders/${orderId}`)
        .then(({ data }) => {
          setOrder(data);
          // Sepet ödeme sayfasına giderken korunur; ödeme kesinleşince boşaltılır
          if (data.status === "PAID") clearCart();
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
    // clearCart her render'da yeni; eklenirse istek döngüye girer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // "Ödeme başarılı" yalnızca sipariş gerçekten ödenmişse söylenir
  const paid = !!order && PAID_STATUSES.includes(order.status);

  return (
    <div className={pageClass}>
      <SEO noindex title={t("pages.orderSuccess.title")} />

      <div className={containerClass}>
        <div className={cx(widthForm, "mt-6")}>
          {loading ? (
            <Spinner label={t("common.loading")} />
          ) : !order ? (
            <Alert tone="warning" title={t("pages.orderSuccess.notFoundTitle")}>
              <p>{t("pages.orderSuccess.notFoundText")}</p>
            </Alert>
          ) : (
            <>
              <Card padding="lg" className="text-center">
                <span
                  className={cx(
                    "inline-flex items-center justify-center w-14 h-14 rounded-full mb-4",
                    paid ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-300",
                  )}
                >
                  {paid ? <Check className="w-7 h-7" aria-hidden /> : <Clock className="w-7 h-7" aria-hidden />}
                </span>
                <h1 className="text-2xl font-bold text-white">
                  {paid ? t("pages.orderSuccess.title") : t("pages.orderSuccess.pendingTitle")}
                </h1>
                <p className="mt-2 text-zinc-300">
                  {paid ? t("pages.orderSuccess.text") : t("pages.orderSuccess.pendingText")}
                </p>

                <dl className={cx(innerRowClass, "mt-6 divide-y divide-zinc-700/60 text-left text-sm")}>
                  <div className="flex justify-between gap-4 px-4 py-3">
                    <dt className="text-zinc-400">{t("pages.orderSuccess.orderNo")}</dt>
                    <dd className="font-mono font-medium text-zinc-100">#{order.id.slice(-8).toUpperCase()}</dd>
                  </div>
                  {order.tournament && (
                    <div className="flex justify-between gap-4 px-4 py-3">
                      <dt className="text-zinc-400 shrink-0">{t("checkout.tournament.short")}</dt>
                      <dd className="text-zinc-100 text-right">{order.tournament.name}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-4 px-4 py-3">
                    <dt className="text-zinc-400">{t("pages.orderSuccess.athlete")}</dt>
                    <dd className="text-zinc-100 text-right">
                      {order.athleteName}
                      <span className="block text-zinc-400">{order.clubName}</span>
                    </dd>
                  </div>
                  <div className="px-4 py-3">
                    <dt className="text-zinc-400 mb-1.5">{t("pages.orderSuccess.packages")}</dt>
                    {order.items.map((item, i) => (
                      <dd key={i} className="flex justify-between gap-4 text-zinc-100">
                        <span>
                          {item.package.name} ({t("common.series", { count: item.seriesCount })})
                          <PriorityBadge show={item.priority} />
                        </span>
                        <span>× {item.quantity}</span>
                      </dd>
                    ))}
                  </div>
                  <div className="flex justify-between items-center gap-4 px-4 py-3">
                    <dt className="text-zinc-400">{t("pages.orderSuccess.total")}</dt>
                    <dd className="text-xl font-bold text-white">{formatTL(order.totalPrice)}</dd>
                  </div>
                </dl>
              </Card>

              {order.account && <AccountClaimCard account={order.account} orderId={order.id} />}

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {!paid && (
                  <LocalizedLink to="/sepet" className={buttonClass("primary")}>
                    {t("pages.orderFailed.retry")}
                  </LocalizedLink>
                )}
                <LocalizedLink to="/" className={buttonClass("ghost")}>
                  {t("pages.orderSuccess.backHome")}
                </LocalizedLink>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
