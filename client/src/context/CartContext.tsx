import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import i18n from "../i18n";
import { toast } from "react-toastify";

export type PackageCategory = "photo" | "video" | "full";

export interface Package {
  id: string;
  category: PackageCategory;
  name: string;
  price: number;
  image: string;
  features: string[];
  discounts: {
    2: number;
    3: number;
  };
  // Sadakat puanı (seri başına). Eski sepetlerde (localStorage) olmayabilir.
  loyaltyPoints?: number;
  // Öncelikli ek ücreti (seri başına); null/yok = bu pakette öncelik seçilemez
  priorityFee?: number | null;
}

export interface CartItem {
  package: Package;
  seriesCount: 1 | 2 | 3;
  quantity: number;
  priority?: boolean;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (pkg: Package, seriesCount?: 1 | 2 | 3) => void;
  removeFromCart: (packageId: string, seriesCount: 1 | 2 | 3) => void;
  updateQuantity: (packageId: string, seriesCount: 1 | 2 | 3, quantity: number) => void;
  updateSeriesCount: (packageId: string, oldSeriesCount: 1 | 2 | 3, newSeriesCount: 1 | 2 | 3) => void;
  setPriority: (packageId: string, seriesCount: 1 | 2 | 3, priority: boolean) => void;
  clearCart: () => void;
  refreshPackages: (fresh: Package[]) => void;
  getItemPrice: (item: CartItem) => number;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  isInCart: (packageId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "ritmika-cart";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    // localStorage'dan yükle
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (pkg: Package, seriesCount: 1 | 2 | 3 = 1) => {
    setItems((prev) => {
      // Aynı paket ve seri sayısı var mı kontrol et
      const existingIndex = prev.findIndex(
        (item) => item.package.id === pkg.id && item.seriesCount === seriesCount
      );

      if (existingIndex > -1) {
        // Varsa quantity artır
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return updated;
      }

      // Yoksa yeni ekle
      return [...prev, { package: pkg, seriesCount, quantity: 1 }];
    });
    toast.success(i18n.t("pages.cartToast.added", { name: pkg.name }));
  };

  const removeFromCart = (packageId: string, seriesCount: 1 | 2 | 3) => {
    setItems((prev) =>
      prev.filter(
        (item) => !(item.package.id === packageId && item.seriesCount === seriesCount)
      )
    );

    toast.info(i18n.t("pages.cartToast.removed"));
  };

  const updateQuantity = (packageId: string, seriesCount: 1 | 2 | 3, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(packageId, seriesCount);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.package.id === packageId && item.seriesCount === seriesCount
          ? { ...item, quantity }
          : item
      )
    );
  };

  const updateSeriesCount = (
    packageId: string,
    oldSeriesCount: 1 | 2 | 3,
    newSeriesCount: 1 | 2 | 3
  ) => {
    setItems((prev) => {
      // Yeni seri sayısıyla aynı paket var mı?
      const existingIndex = prev.findIndex(
        (item) => item.package.id === packageId && item.seriesCount === newSeriesCount
      );

      const currentIndex = prev.findIndex(
        (item) => item.package.id === packageId && item.seriesCount === oldSeriesCount
      );

      if (currentIndex === -1) return prev;

      if (existingIndex > -1 && existingIndex !== currentIndex) {
        // Varsa, quantity'leri birleştir ve eskisini sil
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + updated[currentIndex].quantity,
        };
        return updated.filter((_, i) => i !== currentIndex);
      }

      // Yoksa sadece seri sayısını güncelle
      return prev.map((item) =>
        item.package.id === packageId && item.seriesCount === oldSeriesCount
          ? { ...item, seriesCount: newSeriesCount }
          : item
      );
    });
  };

  const setPriority = (packageId: string, seriesCount: 1 | 2 | 3, priority: boolean) => {
    setItems((prev) =>
      prev.map((item) =>
        item.package.id === packageId && item.seriesCount === seriesCount
          ? { ...item, priority }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  // Sepet paket bilgisini eklendiği anki haliyle saklıyor. Sepet sayfası açılınca
  // güncel paketlerle (fiyat, öncelik ücreti, o anki dildeki ad) tazelenir; artık
  // satışta olmayan paket çıkarılır. Asıl tutarı yine sunucu hesaplar.
  const refreshPackages = (fresh: Package[]) => {
    const byId = new Map(fresh.map((p) => [p.id, p]));
    setItems((prev) =>
      prev.flatMap((item) => {
        const pkg = byId.get(item.package.id);
        if (!pkg) return [];
        return [{ ...item, package: pkg, priority: !!item.priority && pkg.priorityFee != null }];
      }),
    );
  };

  const getItemPrice = (item: CartItem): number => {
    const { package: pkg, seriesCount, quantity } = item;
    const basePrice =
      seriesCount === 1
        ? pkg.price
        : seriesCount === 2
        ? pkg.discounts[2]
        : pkg.discounts[3];
    // Öncelikli: seri başına ek ücret (önizleme — asıl fiyat backend'de hesaplanır)
    const priorityFee = item.priority && pkg.priorityFee ? pkg.priorityFee * seriesCount : 0;
    return (basePrice + priorityFee) * quantity;
  };

  const getTotalPrice = (): number => {
    return items.reduce((total, item) => total + getItemPrice(item), 0);
  };

  const getTotalItems = (): number => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const isInCart = (packageId: string): boolean => {
    return items.some((item) => item.package.id === packageId);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateSeriesCount,
        setPriority,
        clearCart,
        refreshPackages,
        getItemPrice,
        getTotalPrice,
        getTotalItems,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

