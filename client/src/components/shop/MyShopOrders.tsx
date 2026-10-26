import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ChevronRight, ShoppingBag } from "lucide-react";
import { toast } from "react-toastify";
import LocalizedLink from "../LocalizedLink";
import ShopOrderCard from "./ShopOrderCard";
import api from "../../lib/api";
import type { ShopOrder } from "../../lib/shop";

// Profil: "Ürün Siparişlerim". Hiç sipariş yoksa bölüm görünmez.
const MyShopOrders = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    api
      .get<ShopOrder[]>("/api/shop/orders/my")
      .then(({ data }) => setOrders(data))
      .catch((err) => console.error("Ürün siparişleri yüklenemedi:", err));
  }, []);

  // Sipariş bilinmeden dönen ödeme hatası (iyzico) profile yönlenir
  useEffect(() => {
    if (params.get("odeme") !== "basarisiz") return;
    toast.error(params.get("hata") || t("pages.shop.order.failedText"));
    const next = new URLSearchParams(params);
    next.delete("odeme");
    next.delete("hata");
    setParams(next, { replace: true });
  }, [params, setParams, t]);

  if (orders.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <ShoppingBag className="w-5 h-5 text-emerald-400" />
        {t("pages.shop.myOrders")}
      </h2>
      <div className="space-y-3">
        {orders.map((order) => (
          <div key={order.id}>
            <ShopOrderCard order={order} />
            <LocalizedLink
              to={`/urun-siparisi/${order.id}`}
              className="mt-1.5 inline-flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300"
            >
              {t("pages.shop.order.details")}
              <ChevronRight className="w-4 h-4" />
            </LocalizedLink>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MyShopOrders;
