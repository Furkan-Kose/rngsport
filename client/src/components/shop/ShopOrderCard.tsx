import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, CreditCard, Loader2, MapPin, PackageCheck, Truck } from "lucide-react";
import { toast } from "react-toastify";
import { formatDate } from "../../lib/format";
import { formatTL } from "../../lib/loyalty";
import { SHOP_PROGRESS, SHOP_STATUS_CLASSES, isUnpaid, startShopCheckout, type ShopOrder, type ShopStatus } from "../../lib/shop";

export const ShopStatusBadge = ({ status }: { status: ShopStatus }) => {
  const { t } = useTranslation();
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${SHOP_STATUS_CLASSES[status]}`}>
      {t(`pages.shop.status.${status}`)}
    </span>
  );
};

/** Onaylandı → Hazırlanıyor → Kargoda → Teslim edildi */
const ProgressSteps = ({ status }: { status: ShopStatus }) => {
  const { t } = useTranslation();
  const current = SHOP_PROGRESS.indexOf(status);
  return (
    <ol className="grid grid-cols-4 gap-1">
      {SHOP_PROGRESS.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step} className="flex flex-col items-center text-center gap-1.5">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center border text-xs ${
                done ? "bg-emerald-500 border-emerald-400 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-500"
              }`}
            >
              {done ? <Check className="w-4 h-4" /> : i + 1}
            </span>
            <span className={`text-[11px] leading-tight ${done ? "text-emerald-300" : "text-zinc-500"}`}>
              {t(`pages.shop.status.${step}`)}
            </span>
          </li>
        );
      })}
    </ol>
  );
};

// Müşterinin ürün siparişi kartı (profil ve sipariş sayfası)
const ShopOrderCard = ({ order, expanded = false }: { order: ShopOrder; expanded?: boolean }) => {
  const { t } = useTranslation();
  const [paying, setPaying] = useState(false);
  const unpaid = isUnpaid(order.status);
  const personalization = Object.entries(order.personalization || {});

  const pay = async () => {
    setPaying(true);
    try {
      await startShopCheckout(order.id);
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(message || t("pages.shop.checkout.genericError"));
      setPaying(false);
    }
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
      <div className="flex gap-4">
        {order.productImage && (
          <img src={order.productImage} alt={order.productName} className="w-16 h-20 object-cover rounded-xl border border-zinc-800 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="font-semibold text-white leading-snug">
              {order.productName}
              {order.quantity > 1 && <span className="text-zinc-400 font-normal"> × {order.quantity}</span>}
            </h3>
            <ShopStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            {formatTL(order.totalPrice)} · {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      {order.selection && (
        <div className="flex items-center gap-3 bg-zinc-800/50 border border-zinc-700 rounded-xl p-2.5">
          {order.selection.poseImage && (
            <img src={order.selection.poseImage} alt="" className="w-12 h-16 object-cover rounded-lg shrink-0" />
          )}
          <p className="text-sm text-zinc-200">
            {t(`common.apparatus.${order.selection.apparatus}`)} ·{" "}
            {t("pages.shop.checkout.steps.poseN", { n: order.selection.poseNo })}
            {order.selection.poseLabel && <span className="text-zinc-400"> · {order.selection.poseLabel}</span>}
          </p>
        </div>
      )}

      {SHOP_PROGRESS.includes(order.status) && <ProgressSteps status={order.status} />}

      {order.trackingInfo && (
        <div className="flex items-start gap-2 bg-violet-500/10 border border-violet-500/30 rounded-xl px-3 py-2.5 text-sm">
          <Truck className="w-4 h-4 text-violet-300 mt-0.5 shrink-0" />
          <div>
            <p className="text-violet-200 font-medium">{t("pages.shop.order.tracking")}</p>
            <p className="text-zinc-300 break-words">{order.trackingInfo}</p>
          </div>
        </div>
      )}

      {unpaid && (
        <button
          onClick={pay}
          disabled={paying}
          className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          {t("pages.shop.order.payNow")}
        </button>
      )}

      {expanded && (
        <div className="grid sm:grid-cols-2 gap-4 text-sm border-t border-zinc-800 pt-4">
          {personalization.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-zinc-300 font-medium mb-2">
                <PackageCheck className="w-4 h-4 text-emerald-400" />
                {t("pages.shop.checkout.personalization")}
              </p>
              <dl className="space-y-1.5">
                {personalization.map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs text-zinc-500">{order.fieldLabels?.[key] || key}</dt>
                    <dd className="text-zinc-200 break-words whitespace-pre-line">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          <div>
            <p className="flex items-center gap-1.5 text-zinc-300 font-medium mb-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              {t("pages.shop.checkout.shipping")}
            </p>
            <p className="text-zinc-200">{order.recipientName} · {order.phone}</p>
            <p className="text-zinc-400 whitespace-pre-line break-words">
              {order.address}
              {"\n"}
              {order.district} / {order.city} {order.postalCode ?? ""}
            </p>
            {order.customerNote && <p className="text-zinc-500 mt-1 italic">“{order.customerNote}”</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopOrderCard;
