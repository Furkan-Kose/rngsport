import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useCart, type CartItem } from "../context/CartContext";
import api from "../lib/api";
import SEO from "../components/SEO";
import Reveal from "../components/ui/Reveal";
import { APPARATUSES } from "../constants/apparatuses";

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
  const { removeFromCart, updateQuantity, updateSeriesCount, getItemPrice } =
    useCart();
  const { package: pkg, seriesCount, quantity } = item;

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
                {pkg.category === "photo"
                  ? "Fotoğraf"
                  : pkg.category === "video"
                    ? "Video"
                    : "Komple"}{" "}
                Paketi
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
              Seri Sayısı
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
                    <span className="block">{s} Seri</span>
                    <span className="block text-xs mt-0.5 opacity-75">
                      ₺{price.toLocaleString("tr-TR")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">
                Adet
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
              <span className="text-xs text-zinc-500 block">Toplam</span>
              <span className="text-xl font-bold text-white">
                ₺{getItemPrice(item).toLocaleString("tr-TR")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CartPage = () => {
  const { items, getTotalPrice, clearCart } = useCart();
  const [searchParams] = useSearchParams();
  const isEmpty = items.length === 0;

  const [showCheckout, setShowCheckout] = useState(false);
  const [step, setStep] = useState<"form" | "payment">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [paymentHtml, setPaymentHtml] = useState("");

  const [form, setForm] = useState({
    athleteName: "",
    clubName: "",
    birthYear: "",
    customerPhone: "",
    customerEmail: "",
    notes: "",
  });

  const [kvkkAccepted, setKvkkAccepted] = useState(false);
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
      setError("Lütfen tüm zorunlu alanları doldurun");
      return;
    }

    const incompleteItem = items.find(
      (it) => (itemApparatuses[itemKey(it)] ?? []).length !== it.seriesCount,
    );
    if (incompleteItem) {
      setError("Her paket için seri sayısı kadar alet seçmelisiniz");
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
          quantity: item.quantity,
          apparatuses: itemApparatuses[itemKey(item)] ?? [],
        })),
        totalPrice: getTotalPrice(),
      });

      // 2. Ödeme formu al
      const { data: paymentData } = await api.post("/api/payment/checkout", {
        orderId: orderData.order.id,
      });

      // Sepeti temizle
      clearCart();

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
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowCheckout(false);
    setStep("form");
    setError("");
    setPaymentHtml("");
    setForm({
      athleteName: "",
      clubName: "",
      birthYear: "",
      customerPhone: "",
      customerEmail: "",
      notes: "",
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-28 pb-16">
      <SEO
        title="Sepet"
        description="Sepetinizi görüntüleyin ve siparişinizi tamamlayın. RNG Sport profesyonel spor fotoğraf ve video çekim hizmetleri."
        url="https://rngsport.com/sepet"
      />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[28rem] h-[28rem] bg-emerald-600/[0.05] rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <Reveal>
          <div className="flex items-center gap-4 mb-8">
            <Link
              to="/"
              className="flex items-center gap-2 text-zinc-400 hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Ana Sayfa</span>
            </Link>
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
                  Sepetim
                </h1>
                <p className="text-zinc-500 text-sm">
                  {isEmpty ? "Sepetiniz boş" : `${items.length} paket`}
                </p>
              </div>
            </div>

            {!isEmpty && (
              <button
                onClick={clearCart}
                className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Sepeti Temizle</span>
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
              Sepetiniz Boş
            </h2>
            <p className="text-zinc-500 text-center max-w-md mb-8">
              Henüz sepetinize bir paket eklemediniz. Paketlerimizi inceleyerek
              size uygun olanı seçebilirsiniz.
            </p>
            <Link
              to="/#paketler"
              className="inline-flex items-center gap-2 py-3 px-6 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
            >
              <ShoppingCart className="w-5 h-5" />
              Paketleri İncele
            </Link>
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
                        Bu paket için aletleri seçin{" "}
                        <span className="text-red-400">*</span>
                        <span className="text-zinc-600 ml-1">
                          ({selected.length} / {item.seriesCount} seçildi)
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
                              {a.label}
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
                    Sipariş Özeti
                  </h3>

                  <div className="space-y-3 mb-6">
                    {items.map((item) => (
                      <div
                        key={`${item.package.id}-${item.seriesCount}`}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-zinc-400">
                          {item.package.name} ({item.seriesCount} Seri) x
                          {item.quantity}
                        </span>
                        <span className="text-zinc-200">
                          ₺
                          {(
                            (item.seriesCount === 1
                              ? item.package.price
                              : item.package.discounts[item.seriesCount]) *
                            item.quantity
                          ).toLocaleString("tr-TR")}
                        </span>
                      </div>
                    ))}

                    <div className="border-t border-zinc-800 pt-4 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-white">Toplam</span>
                        <span className="text-2xl font-bold text-gradient-brand">
                          ₺{getTotalPrice().toLocaleString("tr-TR")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {items.some(
                    (it) =>
                      (itemApparatuses[itemKey(it)] ?? []).length !==
                      it.seriesCount,
                  ) && (
                    <p className="text-xs text-amber-400 mb-2 text-center">
                      {/* Devam etmeden önce her paket için aletleri seçin. */}
                      Bu yarışma için web sitemiz üzerinden ödeme kapalıdır. Rezervasyon yapabilirsiniz.
                    </p>
                  )}
                  {/* <button
                  disabled={
                    isSubmitting ||
                    items.some(
                      (it) =>
                        (itemApparatuses[itemKey(it)] ?? []).length !==
                        it.seriesCount,
                    )
                  }
                  onClick={() => setShowCheckout(true)}
                  className="w-full py-4 px-6 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  {isSubmitting ? "İşleniyor..." : "Ödemeye Geç"}
                </button> */}

                  {/* ödeme geçici olarak kapalı */}
                  <Link to="/rezervasyon">
                    <button className="w-full py-4 px-6 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 flex items-center justify-center gap-2" >
                      Rezervasyon Yap
                    </button>
                  </Link>

                  <div className="flex justify-center mt-4">
                    <img
                      src="/iyzico.png"
                      alt="iyzico ile güvenli ödeme"
                      className="h-8 opacity-70"
                    />
                  </div>

                  <p className="text-xs text-zinc-500 text-center mt-2">
                    Güvenli ödeme iyzico altyapısı ile sağlanmaktadır.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as const }}
              className={`bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-h-[95vh] overflow-y-auto shadow-[0_0_60px_-10px_rgba(16,185,129,0.3)] ${
                step === "payment" ? "max-w-4xl" : "max-w-lg"
              }`}
            >
              {step === "form" ? (
                <>
                  <div className="flex items-center justify-between p-5 border-b border-zinc-800">
                    <h3 className="text-lg font-semibold text-white">
                      Sipariş Bilgileri
                    </h3>
                    <button
                      onClick={closeModal}
                      className="p-2 text-zinc-400 hover:text-white rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                        {error}
                      </div>
                    )}

                    <div>
                      <label className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                        <User className="w-4 h-4" />
                        Sporcu Adı Soyadı{" "}
                        <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="athleteName"
                        value={form.athleteName}
                        onChange={handleChange}
                        placeholder="Sporcu adı soyadı"
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                        <Building className="w-4 h-4" />
                        Kulüp / Şube <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="clubName"
                        value={form.clubName}
                        onChange={handleChange}
                        placeholder="Kulüp veya şube adı"
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                        <CalendarDays className="w-4 h-4" />
                        Sporcu Doğum Yılı{" "}
                        <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="birthYear"
                        value={form.birthYear}
                        onChange={handleChange}
                        placeholder="Örn: 2015"
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                        <Phone className="w-4 h-4" />
                        İletişim için Telefon{" "}
                        <span className="text-red-400">*</span>
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

                    <div>
                      <label className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                        <Mail className="w-4 h-4" />
                        İletişim için E-posta{" "}
                        <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        name="customerEmail"
                        value={form.customerEmail}
                        onChange={handleChange}
                        placeholder="ornek@gmail.com"
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                        <MessageSquare className="w-4 h-4" />
                        Ek Not{" "}
                        <span className="text-zinc-600">(opsiyonel)</span>
                      </label>
                      <textarea
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        placeholder="Eklemek istediğiniz bir not varsa buraya yazabilirsiniz."
                        rows={3}
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                      />
                    </div>

                    <div className="pt-4 border-t border-zinc-800">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-zinc-400">Toplam Tutar</span>
                        <span className="text-xl font-bold text-emerald-400">
                          ₺{getTotalPrice().toLocaleString("tr-TR")}
                        </span>
                      </div>

                      {/* KVKK Onay */}
                      <div className="mb-4">
                        <label className="flex items-start gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={kvkkAccepted}
                            onChange={(e) => setKvkkAccepted(e.target.checked)}
                            className="mt-1 w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                          />
                          <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                            <Link
                              to="/kvkk-aydinlatma-metni"
                              target="_blank"
                              className="text-emerald-400 hover:text-emerald-300 underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              KVKK Aydınlatma Metni
                            </Link>
                            'ni okudum ve kabul ediyorum.{" "}
                            <span className="text-red-400">*</span>
                          </span>
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || !kvkkAccepted}
                        className="w-full py-4 px-6 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            İşleniyor...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-5 h-5" />
                            Ödemeye Geç
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between p-5 border-b border-zinc-800">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-emerald-400" />
                      Ödeme
                    </h3>
                    <button
                      onClick={closeModal}
                      className="p-2 text-zinc-400 hover:text-white rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6">
                    {/* iyzico checkout form */}
                    <IyzicoCheckoutForm html={paymentHtml} />
                    <p className="text-xs text-zinc-500 text-center mt-4">
                      🔒 Güvenli ödeme iyzico altyapısı ile sağlanmaktadır.
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CartPage;
