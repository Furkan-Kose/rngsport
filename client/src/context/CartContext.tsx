import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
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
}

export interface CartItem {
  package: Package;
  seriesCount: 1 | 2 | 3;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (pkg: Package, seriesCount?: 1 | 2 | 3) => void;
  removeFromCart: (packageId: string, seriesCount: 1 | 2 | 3) => void;
  updateQuantity: (packageId: string, seriesCount: 1 | 2 | 3, quantity: number) => void;
  updateSeriesCount: (packageId: string, oldSeriesCount: 1 | 2 | 3, newSeriesCount: 1 | 2 | 3) => void;
  clearCart: () => void;
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
    toast.success(`${pkg.name} sepete eklendi!`);
  };

  const removeFromCart = (packageId: string, seriesCount: 1 | 2 | 3) => {
    setItems((prev) =>
      prev.filter(
        (item) => !(item.package.id === packageId && item.seriesCount === seriesCount)
      )
    );

    toast.info("Ürün sepetten çıkarıldı!");
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

  const clearCart = () => {
    setItems([]);
  };

  const getItemPrice = (item: CartItem): number => {
    const { package: pkg, seriesCount, quantity } = item;
    const basePrice =
      seriesCount === 1
        ? pkg.price
        : seriesCount === 2
        ? pkg.discounts[2]
        : pkg.discounts[3];
    return basePrice * quantity;
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
        clearCart,
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

