import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../lib/api";
import { buildShowcase, type ShopProduct } from "../lib/shop";

// Aktif mağaza ürünleri sayfa geçişlerinde tekrar istenmesin (dil değişince yenilenir)
const cache = new Map<string, Promise<ShopProduct[]>>();
const loadShopProducts = (lang: string) => {
  if (!cache.has(lang)) {
    cache.set(
      lang,
      api
        .get<ShopProduct[]>("/api/shop/products")
        .then((r) => r.data)
        .catch((err) => {
          cache.delete(lang); // hata kalıcı olmasın, sonraki sayfada yeniden dene
          throw err;
        })
    );
  }
  return cache.get(lang)!;
};

/**
 * Vitrin listesi: önce eski statik ürünler ("Çok yakında") hemen görünür, mağaza
 * ürünleri gelince satıştakiler fiyatıyla öne geçer. API hatasında statik liste kalır.
 */
export const useShowcase = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [shopProducts, setShopProducts] = useState<ShopProduct[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    loadShopProducts(lang)
      .then((list) => alive && setShopProducts(list))
      .catch((err) => console.error("Mağaza ürünleri yüklenemedi:", err))
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, [lang]);

  const items = useMemo(() => buildShowcase(shopProducts, lang), [shopProducts, lang]);
  return { items, loaded, onSale: items.filter((i) => i.purchasable) };
};
