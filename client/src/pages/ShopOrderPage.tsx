import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { PackageX } from "lucide-react";
import { Alert, EmptyState, PageHeader, Spinner } from "../components/ui/kit";
import { containerClass, pageClass, widthForm } from "../lib/siteUi";
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
    <div className={pageClass}>
      <SEO noindex title={t("pages.shop.order.seoTitle")} />
      <div className={containerClass}>
        <div className={widthForm}>
          <PageHeader backTo="/profil" backLabel={t("pages.shop.order.backProfile")} title={t("pages.shop.order.title")} />

          {/* Ödeme sonucu: başarıda gerçek durum siparişten okunur (callback onaylamış olmalı) */}
          {payment === "basarili" && order && order.status !== "PENDING" && order.status !== "FAILED" && (
            <Alert tone="success" title={t("pages.shop.order.paidTitle")} className="mb-6">
              <p>{t("pages.shop.order.paidText")}</p>
            </Alert>
          )}
          {payment === "basarisiz" && (
            <Alert tone="danger" title={t("pages.shop.order.failedTitle")} className="mb-6">
              <p>{paymentError || t("pages.shop.order.failedText")}</p>
            </Alert>
          )}

          {order === undefined ? (
            <Spinner label={t("common.loading")} />
          ) : order === null ? (
            <EmptyState icon={PackageX} title={t("pages.shop.order.notFound")} />
          ) : (
            <>
              <ShopOrderCard order={order} expanded />
              <p className="text-sm text-zinc-400 mt-4">
                {t("pages.shop.order.number")}:{" "}
                <span className="font-mono text-zinc-200">#{order.id.slice(-8).toUpperCase()}</span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopOrderPage;
