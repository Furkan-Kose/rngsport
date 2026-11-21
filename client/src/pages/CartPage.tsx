import { useState, useEffect, useRef } from "react";
import { PackageX, Trash2, Minus, Plus, CreditCard, Lock, CalendarCheck } from "lucide-react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import LocalizedLink from "../components/LocalizedLink";
import { useMyLoyalty } from "../hooks/useMyLoyalty";
import LoyaltyPriceLines from "../components/LoyaltyPriceLines";
import PriorityCheckbox from "../components/PriorityCheckbox";
import { applyDiscount, formatTL, pointsFor } from "../lib/loyalty";
import PriorityBadge from "../components/PriorityBadge";
import { useCart, type CartItem } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import SEO from "../components/SEO";
import Modal from "../components/ui/Modal";
import CustomerFields from "../components/checkout/CustomerFields";
import ApparatusPicker from "../components/checkout/ApparatusPicker";
import KvkkCheckbox from "../components/checkout/KvkkCheckbox";
import {
  Alert,
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  IconButton,
  PageHeader,
  Select,
} from "../components/ui/kit";
import { useTournaments } from "../lib/tournaments";
import { useBottomBar } from "../lib/bottomBar";
import {
  emptyCustomerForm,
  customerFormFromUser,
  fillCustomerFormGaps,
  focusFirstError,
  validateCustomerForm,
  type CustomerFormErrors,
} from "../lib/customerForm";
import { buttonClass, containerClass, cx, pageClass, widthGrid } from "../lib/siteUi";

// iyzico ödeme modu: "popup" = modal içinde, "redirect" = iyzico sayfasına yönlendir
const IYZICO_MODE: "popup" | "redirect" = "redirect";

const FORM_ID = "checkout";

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

  return <div ref={containerRef} className="iyzico-container w-full min-h-[600px]" />;
};

interface CartItemCardProps {
  item: CartItem;
  apparatuses: string[];
  onToggleApparatus: (slug: string) => void;
}

const CartItemCard = ({ item, apparatuses, onToggleApparatus }: CartItemCardProps) => {
  const { removeFromCart, updateQuantity, updateSeriesCount, setPriority, getItemPrice } = useCart();
  const { package: pkg, seriesCount, quantity, priority = false } = item;
  const { t } = useTranslation();

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <img src={pkg.image} alt="" className="w-full sm:w-40 h-36 sm:h-auto object-cover shrink-0" />

        <div className="flex-1 min-w-0 p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">{pkg.name}</h2>
              <p className="text-sm text-zinc-400">
                {t(
                  `checkout.cart.categoryPackage.${pkg.category === "photo" || pkg.category === "video" ? pkg.category : "full"}`,
                )}
              </p>
            </div>
            <IconButton
              variant="ghost"
              icon={Trash2}
              label={t("checkout.cart.remove", { name: pkg.name })}
              onClick={() => removeFromCart(pkg.id, seriesCount)}
            />
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-300 mb-2">{t("checkout.reservation.seriesCount")}</p>
            <div className="grid grid-cols-3 gap-2">
              {([1, 2, 3] as const).map((s) => (
                <Chip
                  key={s}
                  active={seriesCount === s}
                  onClick={() => s !== seriesCount && updateSeriesCount(pkg.id, seriesCount, s)}
                  className="flex-col gap-0 py-1.5 px-1"
                >
                  <span>{t("common.series", { count: s })}</span>
                  <span className="text-xs font-normal opacity-80">
                    {formatTL(s === 1 ? pkg.price : pkg.discounts[s])}
                  </span>
                </Chip>
              ))}
            </div>
          </div>

          <ApparatusPicker selected={apparatuses} max={seriesCount} onToggle={onToggleApparatus} />

          {pkg.priorityFee != null && (
            <PriorityCheckbox
              checked={priority}
              onChange={(checked) => setPriority(pkg.id, seriesCount, checked)}
              fee={pkg.priorityFee}
            />
          )}

          <div className="flex items-center justify-between gap-4 border-t border-zinc-800 pt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400 mr-1">{t("checkout.reservation.quantity")}</span>
              <IconButton
                icon={Minus}
                label={t("checkout.cart.decrease")}
                onClick={() => updateQuantity(pkg.id, seriesCount, quantity - 1)}
              />
              <span className="w-8 text-center text-white font-semibold" aria-live="polite">
                {quantity}
              </span>
              <IconButton
                icon={Plus}
                label={t("checkout.cart.increase")}
                onClick={() => updateQuantity(pkg.id, seriesCount, quantity + 1)}
              />
            </div>
            <p className="text-xl font-bold text-white">{formatTL(getItemPrice(item))}</p>
          </div>
        </div>
      </div>
    </Card>
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

  // Yarışma: sipariş rezervasyona açık yarışmaya bağlanır (tek açıksa otomatik, birden çoksa seçim).
  // Hiç açık yarışma yoksa ödeme kapalı.
  const { open: openTournaments, loading: tournamentsLoading } = useTournaments();
  const [pickedTournamentId, setPickedTournamentId] = useState<string | null>(null);
  const orderTournament =
    openTournaments.length === 1
      ? openTournaments[0]
      : (openTournaments.find((tr) => tr.id === pickedTournamentId) ?? null);
  const bookingClosed = !tournamentsLoading && openTournaments.length === 0;

  const [showCheckout, setShowCheckout] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [step, setStep] = useState<"form" | "payment">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<CustomerFormErrors>({});
  const [kvkkError, setKvkkError] = useState(false);
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
  const [itemApparatuses, setItemApparatuses] = useState<Record<string, string[]>>({});

  const itemKey = (cartItem: CartItem) => `${cartItem.package.id}-${cartItem.seriesCount}`;

  const toggleApparatusOnItem = (key: string, slug: string, seriesCount: number) => {
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

  // Ödemeye geçmeyi engelleyen ilk eksik (düğmenin altında yazar)
  const blocker = bookingClosed
    ? t("checkout.reservation.closedTitle")
    : !orderTournament && !tournamentsLoading
      ? t("checkout.tournament.choose")
      : apparatusMissing
        ? t("checkout.cart.pickApparatusFirst")
        : "";
  const canCheckout = !blocker && !!orderTournament;

  // URL'den hata mesajı kontrolü
  useEffect(() => {
    const errorMsg = searchParams.get("error");
    if (errorMsg) {
      setServerError(decodeURIComponent(errorMsg));
      setShowCheckout(true);
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (fieldErrors[name as keyof CustomerFormErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    const errors = validateCustomerForm(form, t);
    setFieldErrors(errors);
    setKvkkError(!kvkkAccepted);
    if (Object.keys(errors).length > 0) {
      focusFirstError(errors, FORM_ID);
      return;
    }
    if (!kvkkAccepted || !orderTournament || apparatusMissing) return;

    setIsSubmitting(true);

    try {
      // 1. Sipariş oluştur
      const { data: orderData } = await api.post("/api/orders", {
        ...form,
        tournamentId: orderTournament.id,
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
      setServerError(serverMessage || t("checkout.form.errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    if (isSubmitting) return; // işlem sürerken kapanmaz
    setShowCheckout(false);
    setStep("form");
    setServerError("");
    setFieldErrors({});
    setKvkkError(false);
    setPaymentHtml("");
    // Boşa değil profil değerlerine sıfırla: prefill useEffect'i [user]'a bağlı
    // olduğu için tekrar tetiklenmiyor, aksi halde modal yeniden açıldığında
    // girişli kullanıcının bilgileri de silinmiş olurdu.
    setForm(customerFormFromUser(user));
  };

  // Telefonda altta sabit "toplam + ödemeye geç" çubuğu (WhatsApp düğmesi üstüne kayar)
  useBottomBar(!isEmpty && !showCheckout);

  const checkoutButton = (className?: string) => (
    <Button size="lg" icon={CreditCard} disabled={!canCheckout} onClick={() => setShowCheckout(true)} className={className}>
      {t("checkout.cart.toPayment")}
    </Button>
  );

  return (
    <div className={cx(pageClass, !isEmpty && "pb-36 lg:pb-16")}>
      <SEO noindex title={t("checkout.cart.seoTitle")} description={t("checkout.cart.seoDescription")} />

      <div className={containerClass}>
        <div className={widthGrid}>
          <PageHeader
            backTo="/paketler"
            backLabel={t("common.nav.packages")}
            title={t("checkout.cart.title")}
            subtitle={isEmpty ? undefined : t("checkout.cart.itemCount", { count: items.length })}
            actions={
              !isEmpty && (
                <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setShowClearConfirm(true)}>
                  {t("checkout.cart.clear")}
                </Button>
              )
            }
          />

          {isEmpty ? (
            <EmptyState
              icon={PackageX}
              title={t("checkout.cart.emptyTitle")}
              description={t("checkout.cart.emptyText")}
              className="max-w-xl mx-auto"
            >
              <LocalizedLink to="/paketler" className={buttonClass("primary")}>
                {t("checkout.cart.browse")}
              </LocalizedLink>
            </EmptyState>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 items-start">
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => {
                  const key = itemKey(item);
                  return (
                    <CartItemCard
                      key={key}
                      item={item}
                      apparatuses={itemApparatuses[key] ?? []}
                      onToggleApparatus={(slug) => toggleApparatusOnItem(key, slug, item.seriesCount)}
                    />
                  );
                })}

                {/* Diğer yol: rezervasyon (yarışma günü ödeme) */}
                <Alert tone="info" icon={CalendarCheck}>
                  <p>
                    {t("checkout.cart.reserveHint")}{" "}
                    <LocalizedLink to="/rezervasyon" className="text-emerald-400 hover:text-emerald-300 underline">
                      {t("checkout.cart.reserveLink")}
                    </LocalizedLink>
                  </p>
                </Alert>
              </div>

              <Card className="lg:sticky lg:top-28">
                <h2 className="text-lg font-semibold text-white mb-4">{t("checkout.cart.summary")}</h2>

                <ul className="space-y-3 mb-4">
                  {items.map((item) => (
                    <li key={itemKey(item)} className="flex justify-between gap-3 text-sm">
                      <span className="text-zinc-300 min-w-0">
                        {item.package.name}
                        <PriorityBadge show={item.priority} />
                        <span className="block text-zinc-400">
                          {t("common.series", { count: item.seriesCount })} × {item.quantity}
                        </span>
                      </span>
                      <span className="text-zinc-100 shrink-0">{formatTL(getItemPrice(item))}</span>
                    </li>
                  ))}
                </ul>

                {/* Hangi yarışma için */}
                {openTournaments.length > 1 ? (
                  <Field
                    label={t("checkout.tournament.short")}
                    htmlFor="cart-tournament"
                    className="border-t border-zinc-800 pt-4 mb-4"
                  >
                    <Select
                      id="cart-tournament"
                      value={orderTournament?.id ?? ""}
                      onChange={(e) => setPickedTournamentId(e.target.value || null)}
                    >
                      <option value="">{t("checkout.tournament.choose")}</option>
                      {openTournaments.map((tr) => (
                        <option key={tr.id} value={tr.id}>
                          {tr.name} · {tr.date}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : (
                  orderTournament && (
                    <p className="border-t border-zinc-800 pt-4 mb-4 text-sm">
                      <span className="block text-zinc-400">{t("checkout.tournament.short")}</span>
                      <span className="text-zinc-100">
                        {orderTournament.name}
                        <span className="text-zinc-400"> · {orderTournament.date}</span>
                      </span>
                    </p>
                  )
                )}

                <p className="flex justify-between items-center border-t border-zinc-800 pt-4 mb-4">
                  <span className="font-medium text-white">{t("checkout.form.total")}</span>
                  <span className="text-2xl font-bold text-white">{formatTL(discountedTotal)}</span>
                </p>

                {checkoutButton("w-full hidden lg:inline-flex")}
                {blocker && <p className="mt-2 text-sm text-amber-300">{blocker}</p>}

                <p className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
                  <img src="/iyzico.png" alt={t("checkout.cart.iyzicoAlt")} className="h-6 opacity-80" />
                  {t("checkout.cart.secure")}
                </p>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Telefonda sabit alt çubuk: toplam + ödemeye geç */}
      {!isEmpty && !showCheckout && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 bg-zinc-950 border-t border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-xs text-zinc-400">{t("checkout.form.total")}</p>
              <p className="text-xl font-bold text-white">{formatTL(discountedTotal)}</p>
            </div>
            {checkoutButton("ml-auto flex-1 max-w-64")}
          </div>
          {blocker && <p className="mt-1.5 text-sm text-amber-300">{blocker}</p>}
        </div>
      )}

      {/* Sepeti temizleme onayı */}
      <Modal
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title={t("checkout.cart.clearTitle")}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowClearConfirm(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                clearCart();
                setShowClearConfirm(false);
              }}
            >
              {t("checkout.cart.clear")}
            </Button>
          </>
        }
      >
        <p className="text-zinc-300">{t("checkout.cart.clearText")}</p>
      </Modal>

      {/* Sipariş penceresi: sporcu bilgileri + özet, altta sabit ödeme düğmesi */}
      <Modal
        open={showCheckout}
        onClose={closeModal}
        title={step === "form" ? t("checkout.cart.orderInfo") : t("checkout.cart.payment")}
        size="lg"
        footer={
          step === "form" && (
            <div className="w-full flex items-center gap-4">
              <div className="min-w-0">
                <p className="text-xs text-zinc-400">{t("checkout.form.totalAmount")}</p>
                <p className="text-xl font-bold text-white">{formatTL(discountedTotal)}</p>
              </div>
              <Button
                type="submit"
                form={`${FORM_ID}-form`}
                size="lg"
                loading={isSubmitting}
                icon={Lock}
                className="ml-auto flex-1 sm:flex-none sm:min-w-56"
              >
                {isSubmitting ? t("checkout.form.processing") : t("checkout.cart.pay")}
              </Button>
            </div>
          )
        }
      >
        {step === "form" ? (
          <form id={`${FORM_ID}-form`} onSubmit={handleSubmit} noValidate className="space-y-5">
            {serverError && <Alert tone="danger">{serverError}</Alert>}

            <CustomerFields idPrefix={FORM_ID} form={form} errors={fieldErrors} onChange={handleChange} />

            <p className="text-sm text-zinc-400">
              {isAuthenticated ? t("checkout.form.accountLinked") : t("checkout.form.accountNewOrder")}
            </p>

            <div className="border-t border-zinc-800 pt-4">
              <LoyaltyPriceLines
                subtotal={subtotal}
                discountPercent={discountPercent}
                tierName={loyalty?.tier?.name}
                redeemPoints={loyalty?.tier?.minPoints ?? 0}
                earnPoints={earnPoints}
                isGuest={!isAuthenticated}
                loginRedirect="/sepet"
              />

              <KvkkCheckbox
                checked={kvkkAccepted}
                onChange={(checked) => {
                  setKvkkAccepted(checked);
                  if (checked) setKvkkError(false);
                }}
              />
              {kvkkError && <p className="mt-1.5 text-sm text-red-400">{t("checkout.form.errors.kvkk")}</p>}
            </div>
          </form>
        ) : (
          <>
            {/* iyzico checkout form (popup modu) */}
            <IyzicoCheckoutForm html={paymentHtml} />
            <p className="flex items-center justify-center gap-1.5 text-sm text-zinc-400 mt-4">
              <Lock className="w-4 h-4" aria-hidden />
              {t("checkout.cart.secure")}
            </p>
          </>
        )}
      </Modal>
    </div>
  );
};

export default CartPage;
