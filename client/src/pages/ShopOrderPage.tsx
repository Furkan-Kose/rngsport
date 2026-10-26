import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, PackageX } from "lucide-react";
import LocalizedLink from "../components/LocalizedLink";
import SEO from "../components/SEO";
import ShopOrderCard from "../components/shop/ShopOrderCard";
import api from "../lib/api";
import type { ShopOrder } from "../lib/shop";

// /urun-siparisi/:id — iyzico dönüşü buraya gelir (?odeme=basarili|basarisiz&hata=...).
// Giriş zorunlu; sunucu yalnızca siparişin sahibine gösterir.
const ShopOrderPage = () => {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const { t } = useTranslation();
  const [order, setOrder] = useState<ShopOrder | null | undefined>(undefined);
  const payment = params.get("odeme");
  const paymentError = params.get("hata");

  useEffect(() => {
    let alive = true;
    api
      .get<ShopOrder>(`/api/shop/orders/${id}`)
      .then(({ data }) => alive && setOrder(data))
      .catch(() => alive && setOrder(null));
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-zinc-950 pt-28 pb-16">
      <SEO title={t("pages.shop.order.seoTitle")} />
      <div className="container mx-auto px-4 max-w-2xl">
        <LocalizedLink
          to="/profil"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-emerald-400 text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("pages.shop.order.backProfile")}
        </LocalizedLink>

        {/* Ödeme sonucu: başarıda gerçek durum siparişten okunur (callback onaylamış olmalı) */}
        {payment === "basarili" && order && order.status !== "PENDING" && order.status !== "FAILED" && (
          <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-5 py-4 mb-6">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-emerald-300">{t("pages.shop.order.paidTitle")}</p>
              <p className="text-sm text-zinc-300 mt-0.5">{t("pages.shop.order.paidText")}</p>
            </div>
          </div>
        )}
        {payment === "basarisiz" && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-4 mb-6">
            <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
            <div>
              <p className="font-semibold text-red-300">{t("pages.shop.order.failedTitle")}</p>
              <p className="text-sm text-zinc-300 mt-0.5">{paymentError || t("pages.shop.order.failedText")}</p>
            </div>
          </div>
        )}

        <h1 className="text-2xl font-bold text-white mb-4">{t("pages.shop.order.title")}</h1>

        {order === undefined ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : order === null ? (
          <div className="text-center bg-zinc-900/60 border border-zinc-800 rounded-2xl p-10">
            <PackageX className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">{t("pages.shop.order.notFound")}</p>
          </div>
        ) : (
          <>
            <ShopOrderCard order={order} expanded />
            <p className="text-xs text-zinc-500 mt-4">
              {t("pages.shop.order.number")}: {order.id}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ShopOrderPage;
