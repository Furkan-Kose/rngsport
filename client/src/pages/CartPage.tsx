import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ShoppingCart,
  ArrowLeft,
  PackageX,
  Trash2,
  Minus,
  Plus,
  X,
  User,
  Phone,
  Building,
  CalendarDays,
  MessageSquare,
  Loader2,
  CreditCard,
  Mail,
  Check,
} from "lucide-react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import LocalizedLink from "../components/LocalizedLink";
import { formatNumber } from "../lib/format";
import { useMyLoyalty } from "../hooks/useMyLoyalty";
import LoyaltyPriceLines from "../components/LoyaltyPriceLines";
import PriorityCheckbox from "../components/PriorityCheckbox";
import { applyDiscount, formatTL, pointsFor } from "../lib/loyalty";
import PriorityBadge from "../components/PriorityBadge";
import { AnimatePresence, motion } from "framer-motion";
import { useCart, type CartItem } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import SEO from "../components/SEO";
import Reveal from "../components/ui/Reveal";
import { APPARATUSES } from "../constants/apparatuses";
import {
  emptyCustomerForm,
  customerFormFromUser,
  fillCustomerFormGaps,
} from "../lib/customerForm";

// iyzico ödeme modu: "popup" = modal içinde, "redirect" = iyzico sayfasına yönlendir
const IYZICO_MODE: "popup" | "redirect" = "redirect";

// iyzico checkout form'unu render eden component
const IyzicoCheckoutForm = ({ html }: { html: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !html) return;

    // HTML'i container'a ekle
    containerRef.current.innerHTML = html;

    // Script tag'lerini bul ve çalıştır
    const scripts = containerRef.current.querySelectorAll("script");
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");

      // Tüm attributeleri kopyala
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });

      // Script içeriğini kopyala
      newScript.textContent = oldScript.textContent;

      // Eski script'i yenisiyle değiştir
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });

    // iframe yüklendikten sonra boyutlarını ayarla
    const checkIframe = setInterval(() => {
      const iframe = containerRef.current?.querySelector("iframe");
      if (iframe) {
        iframe.style.width = "100%";
        iframe.style.minWidth = "100%";
        iframe.style.height = "600px";
        iframe.style.minHeight = "600px";
        iframe.style.maxWidth = "100%";
        iframe.style.border = "none";
        clearInterval(checkIframe);
      }
    }, 100);

    return () => clearInterval(checkIframe);
  }, [html]);

  return (
    <div
      ref={containerRef}
      className="iyzico-container"
      style={{
        minHeight: "600px",
        width: "100%",
      }}
    />
  );
};

const CartItemCard = ({ item }: { item: CartItem }) => {
  const { removeFromCart, updateQuantity, updateSeriesCount, setPriority, getItemPrice } =
    useCart();
  const { package: pkg, seriesCount, quantity, priority = false } = item;
  const { t } = useTranslation();

  const handleSeriesChange = (newSeries: 1 | 2 | 3) => {
    if (newSeries !== seriesCount) {
      updateSeriesCount(pkg.id, seriesCount, newSeries);
    }
  };

  return (
    <div className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 hover:border-emerald-500/30 rounded-2xl overflow-hidden transition-colors">
      <div className="flex flex-col sm:flex-row">
        <div className="relative w-full sm:w-40 h-40 sm:h-auto shrink-0">
          <img
            src={pkg.image}
            alt={pkg.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-r from-transparent to-zinc-900/60 hidden sm:block" />
        </div>

        <div className="flex-1 p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                {pkg.name}
              </h3>
              <p className="text-sm text-zinc-500">
                {t(`checkout.cart.categoryPackage.${pkg.category === "photo" || pkg.category === "video" ? pkg.category : "full"}`)}
              </p>
            </div>
            <button
              onClick={() => removeFromCart(pkg.id, seriesCount)}
              className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4">
            <span className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
              {t("checkout.reservation.seriesCount")}
            </span>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((s) => {
                const price = s === 1 ? pkg.price : pkg.discounts[s];
                const isSelected = seriesCount === s;
                return (
                  <button
                    key={s}
                    onClick={() => handleSeriesChange(s)}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                        : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    <span className="block">{t("common.series", { count: s })}</span>
                    <span className="block text-xs mt-0.5 opacity-75">
                      ₺{formatNumber(price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {pkg.priorityFee != null && (
            <PriorityCheckbox
              className="mb-4"
              checked={priority}
              onChange={(checked) => setPriority(pkg.id, seriesCount, checked)}
              fee={pkg.priorityFee}
            />
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">
                {t("checkout.reservation.quantity")}
              </span>
              <div className="flex items-center gap-1 bg-zinc-800 rounded-lg">
                <button
                  onClick={() =>
                    updateQuantity(pkg.id, seriesCount, quantity - 1)
                  }
                  className="p-2 text-zinc-400 hover:text-white transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center text-white font-medium">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    updateQuantity(pkg.id, seriesCount, quantity + 1)
                  }
                  className="p-2 text-zinc-400 hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-zinc-500 block">{t("checkout.form.total")}</span>
              <span className="text-xl font-bold text-white">
                ₺{formatNumber(getItemPrice(item))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CartPage = () => {
  const { items, getTotalPrice, getItemPrice, clearCart, refreshPackages } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  // Sadakat önizlemesi (asıl indirim ve puan backend'de hesaplanır)
  const loyalty = useMyLoyalty();
  const subtotal = getTotalPrice();
  const discountPercent = loyalty?.tier?.discountPercent ?? 0;
  const { totalPrice: discountedTotal } = applyDiscount(subtotal, discountPercent);
  const earnPoints = items.reduce(
    (sum, it) => sum + pointsFor(it.package.loyaltyPoints, it.seriesCount, it.quantity),
    0,
  );
  const [searchParams] = useSearchParams();
  const isEmpty = items.length === 0;

  const [showCheckout, setShowCheckout] = useState(false);
  const [step, setStep] = useState<"form" | "payment">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [paymentHtml, setPaymentHtml] = useState("");

  const [form, setForm] = useState(emptyCustomerForm);

  const [kvkkAccepted, setKvkkAccepted] = useState(false);

  // Girişli kullanıcının profilinden boş alanları ön-doldur (yazılmış değeri ezme).
  // Sporcu adı da dolar: çekim listesi eşleşmesi tam isim eşitliğine bakıyor, her
  // seferinde elle yazılması yazım farkı yüzünden eşleşmeyi düşürüyordu.
  useEffect(() => {
    if (!user) return;
    setForm((prev) => fillCustomerFormGaps(prev, user));
  }, [user]);

  // Sepet satırı bazlı alet seçimi: key = `${packageId}-${seriesCount}` (sepet item key'i)
  const [itemApparatuses, setItemApparatuses] = useState<
    Record<string, string[]>
  >({});

  const itemKey = (cartItem: CartItem) =>
    `${cartItem.package.id}-${cartItem.seriesCount}`;

  const toggleApparatusOnItem = (
    key: string,
    slug: string,
    seriesCount: number,
  ) => {
    setItemApparatuses((prev) => {
      const current = prev[key] ?? [];
      if (current.includes(slug)) {
        return { ...prev, [key]: current.filter((s) => s !== slug) };
      }
      if (current.length >= seriesCount) return prev;
      return { ...prev, [key]: [...current, slug] };
    });
  };

  // Sepetteki paket bilgisini güncel fiyat/ad ile tazele (bkz. CartContext.refreshPackages)
  useEffect(() => {
    if (items.length === 0) return;
    api
      .get("/api/packages")
      .then(({ data }) => refreshPackages(data))
      .catch((err) => console.error("Paketler tazelenemedi:", err));
    // Yalnızca sayfa açılışında (dil değişince sayfa yeniden kurulur)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Her paket için seri sayısı kadar alet seçilmeden ödemeye geçilmez
  const apparatusMissing = items.some(
    (it) => (itemApparatuses[itemKey(it)] ?? []).length !== it.seriesCount,
  );

  // URL'den hata mesajı kontrolü
  useEffect(() => {
    const errorMsg = searchParams.get("error");
    if (errorMsg) {
      setError(decodeURIComponent(errorMsg));
      setShowCheckout(true);
    }
  }, [searchParams]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !form.athleteName.trim() ||
      !form.clubName.trim() ||
      !form.birthYear.trim() ||
      !form.customerPhone.trim() ||
      !form.customerEmail.trim()
    ) {
      setError(t("checkout.form.errors.required"));
      return;
    }

    const incompleteItem = items.find(
      (it) => (itemApparatuses[itemKey(it)] ?? []).length !== it.seriesCount,
    );
    if (incompleteItem) {
      setError(t("checkout.form.errors.apparatus"));
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Sipariş oluştur
      const { data: orderData } = await api.post("/api/orders", {
        ...form,
        items: items.map((item) => ({
          package: {
            id: item.package.id,
            name: item.package.name,
            category: item.package.category,
            price: item.package.price,
            discounts: item.package.discounts,
          },
          seriesCount: item.seriesCount,
          priority: !!item.priority,
          quantity: item.quantity,
          apparatuses: itemApparatuses[itemKey(item)] ?? [],
        })),
        totalPrice: getTotalPrice(),
      });

      // 2. Ödeme formu al
      const { data: paymentData } = await api.post("/api/payment/checkout", {
        orderId: orderData.order.id,
      });

      // Sepet burada boşaltılmaz: ödeme başarısız olursa müşteri dolu sepete döner.
      // Başarı sayfası (OrderSuccessPage) sipariş PAID ise boşaltır.

      // iyzico moduna göre işlem yap
      if (IYZICO_MODE === "redirect" && paymentData.paymentPageUrl) {
        // iyzico'nun kendi sayfasına yönlendir
        window.location.href = paymentData.paymentPageUrl;
        return;
      }

      // Popup modu: modal içinde göster
      setPaymentHtml(paymentData.checkoutFormContent);
      setStep("payment");
    } catch (err) {
      // Sunucu mesajı istek dilinde gelir
      const serverMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(serverMessage || t("checkout.form.errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pencere açıkken arka sayfa kaymasın; Esc ile kapanır (işlem sürerken kapanmaz)
  useEffect(() => {
    if (!showCheckout) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
    // closeModal her render'da yeni; yalnızca açılıp kapanmaya ve işlem durumuna bağlı
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCheckout, isSubmitting]);

  const closeModal = () => {
    setShowCheckout(false);
    setStep("form");
    setError("");
    setPaymentHtml("");
    // Boşa değil profil değerlerine sıfırla: prefill useEffect'i [user]'a bağlı
    // olduğu için tekrar tetiklenmiyor, aksi halde modal yeniden açıldığında
    // girişli kullanıcının bilgileri de silinmiş olurdu.
    setForm(customerFormFromUser(user));
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-28 pb-16">
      <SEO
        title={t("checkout.cart.seoTitle")}
        description={t("checkout.cart.seoDescription")}
      />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[28rem] h-[28rem] bg-emerald-600/[0.05] rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <Reveal>
          <div className="flex items-center gap-4 mb-8">
            <LocalizedLink
              to="/"
              className="flex items-center gap-2 text-zinc-400 hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">{t("checkout.reservation.home")}</span>
            </LocalizedLink>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-xl" />
                <div className="relative w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <ShoppingCart className="w-7 h-7 text-emerald-400" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient-brand">
                  {t("checkout.cart.title")}
                </h1>
                <p className="text-zinc-500 text-sm">
                  {isEmpty ? t("checkout.cart.empty") : t("checkout.cart.itemCount", { count: items.length })}
                </p>
              </div>
            </div>

            {!isEmpty && (
              <button
                onClick={clearCart}
                className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">{t("checkout.cart.clear")}</span>
              </button>
            )}
          </div>
        </Reveal>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-linear-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur-2xl scale-150" />
              <div className="relative w-32 h-32 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <PackageX className="w-16 h-16 text-zinc-600" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-zinc-300 mb-3">
              {t("checkout.cart.emptyTitle")}
            </h2>
            <p className="text-zinc-500 text-center max-w-md mb-8">
              {t("checkout.cart.emptyText")}
            </p>
            <LocalizedLink
              to="/paketler"
              className="inline-flex items-center gap-2 py-3 px-6 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
            >
              <ShoppingCart className="w-5 h-5" />
              {t("checkout.cart.browse")}
            </LocalizedLink>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item, idx) => {
                const key = itemKey(item);
                const selected = itemApparatuses[key] ?? [];
                return (
                  <Reveal
                    key={key}
                    delay={idx * 0.06}
                    className="space-y-2 block"
                  >
                    <CartItemCard item={item} />
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
                      <p className="text-xs text-zinc-400 mb-2">
                        {t("checkout.apparatus.pickForPackage")}{" "}
                        <span className="text-red-400">*</span>
                        <span className="text-zinc-600 ml-1">
                          {t("checkout.apparatus.selected", { count: selected.length, total: item.seriesCount })}
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {APPARATUSES.map((a) => {
                          const active = selected.includes(a.slug);
                          const slotsFull =
                            !active && selected.length >= item.seriesCount;
                          return (
                            <button
                              key={a.slug}
                              type="button"
                              disabled={slotsFull}
                              onClick={() =>
                                toggleApparatusOnItem(
                                  key,
                                  a.slug,
                                  item.seriesCount,
                                )
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                active
                                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                                  : "bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:border-zinc-500"
                              }`}
                            >
                              {t(`common.apparatus.${a.slug}`)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-28 relative">
                {/* Accent line on top */}
                <div className="absolute -top-px left-6 right-6 h-px bg-linear-to-r from-transparent via-emerald-500/60 to-transparent" />
                <div className="relative bg-zinc-900/70 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">
                    {t("checkout.cart.summary")}
                  </h3>

                  <div className="space-y-3 mb-6">
                    {items.map((item) => (
                      <div
                        key={`${item.package.id}-${item.seriesCount}`}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-zinc-400">
                          {item.package.name}
                          {item.priority && <span className="text-amber-300"> ⚡ {t("checkout.priority.badge")}</span>} (
                          {t("common.series", { count: item.seriesCount })}) x{item.quantity}
                        </span>
                        <span className="text-zinc-200">
                          ₺{formatNumber(getItemPrice(item))}
                        </span>
                      </div>
                    ))}

                    <div className="border-t border-zinc-800 pt-4 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-white">{t("checkout.form.total")}</span>
                        <span className="text-2xl font-bold text-gradient-brand">
                          {formatTL(discountedTotal)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {apparatusMissing && (
                    <p className="text-xs text-amber-400 mb-2 text-center">
                      {t("checkout.cart.pickApparatusFirst")}
                    </p>
                  )}
                  <button
                    disabled={isSubmitting || apparatusMissing}
                    onClick={() => setShowCheckout(true)}
                    className="w-full py-4 px-6 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    {isSubmitting ? t("checkout.form.processing") : t("checkout.cart.toPayment")}
                  </button>

                  <div className="flex justify-center mt-4">
                    <img
                      src="/iyzico.png"
                      alt={t("checkout.cart.iyzicoAlt")}
                      className="h-8 opacity-70"
                    />
                  </div>

                  <p className="text-xs text-zinc-500 text-center mt-2">
                    {t("checkout.cart.secure")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sipariş penceresi. document.body'ye çizilir: sayfa içeriği MainLayout'ta
          "relative z-10" bir kutuda olduğu için içeride kalsa üst menünün (z-50)
          altında kalıyordu. Masaüstünde iki sütun, mobilde tam ekran + sabit alt bar. */}
      {createPortal(
        <AnimatePresence>
          {showCheckout && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] flex items-stretch sm:items-center justify-center sm:p-4 bg-black/75 backdrop-blur-md"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget && !isSubmitting) closeModal();
              }}
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="checkout-title"
                initial={{ opacity: 0, scale: 0.97, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 20 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as const }}
                className="relative flex flex-col w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-4xl bg-zinc-900 sm:border border-zinc-800 sm:rounded-2xl overflow-hidden shadow-[0_0_60px_-10px_rgba(16,185,129,0.3)]"
              >
                {/* Başlık — sabit */}
                <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-800">
                  <h3 id="checkout-title" className="text-lg font-semibold text-white flex items-center gap-2">
                    {step === "form" ? (
                      <>
                        <ShoppingCart className="w-5 h-5 text-emerald-400" />
                        {t("checkout.cart.orderInfo")}
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 text-emerald-400" />
                        {t("checkout.cart.payment")}
                      </>
                    )}
                  </h3>
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                    aria-label={t("common.close")}
                    className="p-2 text-zinc-400 hover:text-white rounded-lg transition-colors disabled:opacity-40"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {step === "form" ? (
                  <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    {/* Kayan içerik */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
                        {/* Sol: sporcu ve iletişim bilgileri */}
                        <div className="p-5 sm:p-6 space-y-4">
                          {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                              {error}
                            </div>
                          )}

                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <label className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                                <User className="w-4 h-4" />
                                {t("checkout.form.athleteName")} <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                name="athleteName"
                                value={form.athleteName}
                                onChange={handleChange}
                                placeholder={t("checkout.form.athleteNamePlaceholder")}
                                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                              />
                            </div>
                            <div>
                              <label className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                                <Building className="w-4 h-4" />
                                {t("checkout.form.clubName")} <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                name="clubName"
                                value={form.clubName}
                                onChange={handleChange}
                                placeholder={t("checkout.form.clubNamePlaceholder")}
                                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                              />
                            </div>
                            <div>
                              <label className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                                <CalendarDays className="w-4 h-4" />
                                {t("checkout.form.birthYear")} <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                name="birthYear"
                                value={form.birthYear}
                                onChange={handleChange}
                                placeholder={t("checkout.form.birthYearPlaceholder")}
                                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                              />
                            </div>
                            <div>
                              <label className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                                <Phone className="w-4 h-4" />
                                {t("checkout.form.phone")} <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="tel"
                                name="customerPhone"
                                value={form.customerPhone}
                                onChange={handleChange}
                                placeholder="0532 123 45 67"
                                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                              <Mail className="w-4 h-4" />
                              {t("checkout.form.contactEmail")} <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="email"
                              name="customerEmail"
                              value={form.customerEmail}
                              onChange={handleChange}
                              placeholder={t("checkout.form.emailPlaceholder")}
                              className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                            />
                          </div>

                          <div>
                            <label className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                              <MessageSquare className="w-4 h-4" />
                              {t("checkout.form.notes")} <span className="text-zinc-600">{t("checkout.form.optional")}</span>
                            </label>
                            <textarea
                              name="notes"
                              value={form.notes}
                              onChange={handleChange}
                              placeholder={t("checkout.form.notesPlaceholder")}
                              rows={3}
                              className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                            />
                          </div>

                          {/* Hesap bağlama bilgisi */}
                          {isAuthenticated ? (
                            <div className="flex items-start gap-2 text-sm text-emerald-400/90 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3">
                              <Check className="w-4 h-4 mt-0.5 shrink-0" />
                              <span>{t("checkout.form.accountLinked")}</span>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2 text-sm text-zinc-400 bg-zinc-800/40 border border-zinc-700/50 rounded-xl px-4 py-3">
                              <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
                              <span>{t("checkout.form.accountNewOrder")}</span>
                            </div>
                          )}
                        </div>

                        {/* Sağ: sipariş özeti */}
                        <aside className="p-5 sm:p-6 bg-zinc-950/50 border-t lg:border-t-0 lg:border-l border-zinc-800 space-y-4">
                          <h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                            {t("checkout.cart.summary")}
                          </h4>
                          <ul className="space-y-3">
                            {items.map((item) => (
                              <li key={itemKey(item)} className="text-sm">
                                <div className="flex justify-between gap-3">
                                  <span className="text-zinc-200 min-w-0">
                                    {item.package.name}
                                    <PriorityBadge show={item.priority} />
                                  </span>
                                  <span className="text-zinc-200 shrink-0">₺{formatNumber(getItemPrice(item))}</span>
                                </div>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                  {t("common.series", { count: item.seriesCount })} × {item.quantity}
                                  {(itemApparatuses[itemKey(item)] ?? []).length > 0 && (
                                    <>
                                      {" · "}
                                      {(itemApparatuses[itemKey(item)] ?? [])
                                        .map((slug) => t(`common.apparatus.${slug}`))
                                        .join(", ")}
                                    </>
                                  )}
                                </p>
                              </li>
                            ))}
                          </ul>

                          <div className="pt-3 border-t border-zinc-800">
                            <LoyaltyPriceLines
                              subtotal={subtotal}
                              discountPercent={discountPercent}
                              tierName={loyalty?.tier?.name}
                              redeemPoints={loyalty?.tier?.minPoints ?? 0}
                              earnPoints={earnPoints}
                              isGuest={!isAuthenticated}
                              loginRedirect="/sepet"
                            />
                          </div>

                          {/* KVKK Onay */}
                          <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={kvkkAccepted}
                              onChange={(e) => setKvkkAccepted(e.target.checked)}
                              className="mt-1 w-5 h-5 shrink-0 rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                            />
                            <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                              <LocalizedLink
                                to="/kvkk-aydinlatma-metni"
                                target="_blank"
                                className="text-emerald-400 hover:text-emerald-300 underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {t("checkout.form.kvkkLinkShort")}
                              </LocalizedLink>
                              {t("checkout.form.kvkkSuffix")} <span className="text-red-400">*</span>
                            </span>
                          </label>
                        </aside>
                      </div>
                    </div>

                    {/* Alt bar — sabit: toplam + ödeme butonu hep görünür */}
                    <div className="shrink-0 flex items-center gap-4 px-5 sm:px-6 py-4 border-t border-zinc-800 bg-zinc-900">
                      <div className="min-w-0">
                        <p className="text-xs text-zinc-500">{t("checkout.form.totalAmount")}</p>
                        <p className="text-xl sm:text-2xl font-bold text-gradient-brand">{formatTL(discountedTotal)}</p>
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting || !kvkkAccepted}
                        className="ml-auto flex-1 sm:flex-none sm:min-w-56 py-3.5 px-6 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {t("checkout.form.processing")}
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-5 h-5" />
                            {t("checkout.cart.toPayment")}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex-1 overflow-y-auto p-6">
                    {/* iyzico checkout form (popup modu) */}
                    <IyzicoCheckoutForm html={paymentHtml} />
                    <p className="text-xs text-zinc-500 text-center mt-4">
                      🔒 {t("checkout.cart.secure")}
                    </p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
};

export default CartPage;
