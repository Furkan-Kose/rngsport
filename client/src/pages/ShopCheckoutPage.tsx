import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Lock, Minus, PackageX, Plus, ShoppingBag } from "lucide-react";
import LocalizedLink from "../components/LocalizedLink";
import SEO from "../components/SEO";
import api from "../lib/api";
import { useLocalizedPath } from "../lib/localePath";
import { formatTL } from "../lib/loyalty";
import { startShopCheckout, type ShippingInput, type ShopOrder, type ShopProduct } from "../lib/shop";
import PosePicker, { StepIndicator } from "../components/shop/PosePicker";
import { Alert, Button, Card, Checkbox, EmptyState, IconButton, PageHeader, Spinner } from "../components/ui/kit";
import { buttonClass, containerClass, cx, innerRowClass, inputClass, labelClass, pageClass, widthGrid } from "../lib/siteUi";

const MAX_QUANTITY = 5;
const EMPTY_SHIPPING: ShippingInput = {
  recipientName: "",
  phone: "",
  city: "",
  district: "",
  address: "",
  postalCode: "",
  note: "",
};

// Etiket alanına bağlıdır (htmlFor = alanın id'si)
const Label = ({ children, required, htmlFor }: { children: string; required?: boolean; htmlFor: string }) => (
  <label htmlFor={htmlFor} className={labelClass}>
    {children}
    {required && (
      <span className="text-red-400 ml-0.5" aria-hidden>
        *
      </span>
    )}
  </label>
);

// /urunler/:slug/siparis — giriş zorunlu (ProtectedRoute). Sipariş oluşturulur, ardından
// iyzico'nun kendi ödeme sayfasına yönlendirilir; dönüş /urun-siparisi/:id.
const ShopCheckoutPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const localized = useLocalizedPath();
  const [product, setProduct] = useState<ShopProduct | null | undefined>(undefined);
  const [values, setValues] = useState<Record<string, string>>({});
  const [shipping, setShipping] = useState<ShippingInput>(EMPTY_SHIPPING);
  const [quantity, setQuantity] = useState(1);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // Alet → poz adımları (poz seçimi olmayan ürün doğrudan 3. adımda başlar)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [apparatus, setApparatus] = useState<string | null>(null);
  const [poseNo, setPoseNo] = useState<number | null>(null);

  const goStep = (next: 1 | 2 | 3) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    let alive = true;
    api
      .get<ShopProduct>(`/api/shop/products/${slug}`)
      .then(({ data }) => alive && setProduct(data.purchasable ? data : null))
      .catch(() => alive && setProduct(null));
    // Son siparişteki adres (yoksa hesaptaki ad/telefon) — kullanıcı yazmaya başladıysa ezme
    api
      .get<Partial<ShippingInput>>("/api/shop/last-address")
      .then(({ data }) =>
        alive &&
        setShipping((prev) => {
          const next = { ...prev };
          for (const key of Object.keys(EMPTY_SHIPPING) as (keyof ShippingInput)[]) {
            const v = data[key];
            if (!next[key] && typeof v === "string") next[key] = v;
          }
          return next;
        })
      )
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [slug]);

  const setShip = (key: keyof ShippingInput, value: string) => setShipping((prev) => ({ ...prev, [key]: value }));
  const hasPoses = !!product?.poseOptions?.enabled && product.poseOptions.apparatuses.length > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setError("");
    if (!accepted) {
      setError(t("pages.shop.checkout.acceptRequired"));
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post<{ order: ShopOrder }>("/api/shop/orders", {
        productSlug: product.slug,
        quantity,
        personalization: values,
        shipping,
        ...(hasPoses && { selection: { apparatus, poseNo } }),
      });
      // Yönlendirme başarılıysa sayfa değişir; submitting açık kalır (çift tıklama olmasın)
      await startShopCheckout(data.order.id);
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(message || t("pages.shop.checkout.genericError"));
      setSubmitting(false);
    }
  };

  if (product === undefined) {
    return (
      <div className={pageClass}>
        <Spinner label={t("common.loading")} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className={pageClass}>
        <div className={containerClass}>
          <EmptyState icon={PackageX} title={t("pages.shop.checkout.notOnSale")} className="max-w-md mx-auto mt-10">
            <LocalizedLink to="/urunler" className={buttonClass("primary")}>
              {t("pages.products.backAll")}
            </LocalizedLink>
          </EmptyState>
        </div>
      </div>
    );
  }

  const total = (product.price ?? 0) * quantity;
  const poseOptions = product.poseOptions;
  const selectedPose = poseOptions?.apparatuses.find((a) => a.slug === apparatus)?.poses.find((p) => p.no === poseNo);
  const currentStep = hasPoses ? step : 3;
  // Ulaşılabilecek en ileri adım: alet seçildiyse poz, poz da seçildiyse bilgiler
  const maxStep = apparatus ? (selectedPose ? 3 : 2) : 1;

  return (
    <div className={pageClass}>
      <SEO noindex title={t("pages.shop.checkout.seoTitle", { name: product.name })} />
      <div className={containerClass}>
        <div className={widthGrid}>
        <PageHeader
          backTo={`/urunler/${product.slug}`}
          backLabel={product.name}
          title={t("pages.shop.checkout.title")}
        />

        {hasPoses && <StepIndicator step={currentStep} maxStep={maxStep} onStep={goStep} />}

        {hasPoses && currentStep < 3 ? (
          <PosePicker
            options={poseOptions!}
            step={currentStep as 1 | 2}
            apparatus={apparatus}
            poseNo={poseNo}
            onApparatus={(slug) => {
              if (slug !== apparatus) setPoseNo(null);
              setApparatus(slug);
              goStep(2);
            }}
            onPose={setPoseNo}
            onBack={() => goStep(1)}
            onNext={() => goStep(3)}
          />
        ) : (
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
          <div className="space-y-6">
            {/* Kişiselleştirme */}
            {product.customFields.length > 0 && (
              <Card>
                <h2 className="text-lg font-semibold text-white mb-1">{t("pages.shop.checkout.personalization")}</h2>
                <p className="text-sm text-zinc-400 mb-5">{t("pages.shop.checkout.personalizationHint")}</p>
                <div className="space-y-4">
                  {product.customFields.map((field) => (
                    <div key={field.key}>
                      <Label htmlFor={`field-${field.key}`} required={field.required}>
                        {field.label}
                      </Label>
                      {field.maxLength > 100 ? (
                        <textarea
                          id={`field-${field.key}`}
                          rows={3}
                          value={values[field.key] ?? ""}
                          onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                          maxLength={field.maxLength}
                          required={field.required}
                          className={`${inputClass} resize-y`}
                        />
                      ) : (
                        <input
                          id={`field-${field.key}`}
                          type="text"
                          value={values[field.key] ?? ""}
                          onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                          maxLength={field.maxLength}
                          required={field.required}
                          className={inputClass}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Teslimat */}
            <Card>
              <h2 className="text-lg font-semibold text-white mb-5">{t("pages.shop.checkout.shipping")}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ship-recipientName" required>{t("pages.shop.checkout.recipientName")}</Label>
                  <input id="ship-recipientName" value={shipping.recipientName} onChange={(e) => setShip("recipientName", e.target.value)} required maxLength={100} autoComplete="name" className={inputClass} />
                </div>
                <div>
                  <Label htmlFor="ship-phone" required>{t("pages.shop.checkout.phone")}</Label>
                  <input id="ship-phone" type="tel" inputMode="tel" value={shipping.phone} onChange={(e) => setShip("phone", e.target.value)} required maxLength={20} placeholder="05xx xxx xx xx" autoComplete="tel" className={inputClass} />
                </div>
                <div>
                  <Label htmlFor="ship-city" required>{t("pages.shop.checkout.city")}</Label>
                  <input id="ship-city" value={shipping.city} onChange={(e) => setShip("city", e.target.value)} required maxLength={50} autoComplete="address-level1" className={inputClass} />
                </div>
                <div>
                  <Label htmlFor="ship-district" required>{t("pages.shop.checkout.district")}</Label>
                  <input id="ship-district" value={shipping.district} onChange={(e) => setShip("district", e.target.value)} required maxLength={50} autoComplete="address-level2" className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="ship-address" required>{t("pages.shop.checkout.address")}</Label>
                  <textarea id="ship-address" rows={3} value={shipping.address} onChange={(e) => setShip("address", e.target.value)} required minLength={10} maxLength={500} autoComplete="street-address" placeholder={t("pages.shop.checkout.addressPlaceholder")} className={`${inputClass} resize-y`} />
                </div>
                <div>
                  <Label htmlFor="ship-postalCode">{t("pages.shop.checkout.postalCode")}</Label>
                  <input id="ship-postalCode" inputMode="numeric" value={shipping.postalCode} onChange={(e) => setShip("postalCode", e.target.value)} maxLength={10} autoComplete="postal-code" className={inputClass} />
                </div>
                <div>
                  <Label htmlFor="ship-note">{t("pages.shop.checkout.note")}</Label>
                  <input id="ship-note" value={shipping.note} onChange={(e) => setShip("note", e.target.value)} maxLength={500} className={inputClass} />
                </div>
              </div>
            </Card>
          </div>

          {/* Özet */}
          <Card className="lg:sticky lg:top-28 space-y-5">
            <div className="flex gap-4">
              {product.image && <img src={product.image} alt="" className="w-20 h-24 object-cover rounded-xl border border-zinc-800" />}
              <div className="min-w-0">
                <h2 className="font-semibold text-white leading-snug">{product.name}</h2>
                <p className="text-sm text-zinc-400 mt-1">{formatTL(product.price ?? 0)}</p>
              </div>
            </div>

            {hasPoses && selectedPose && apparatus && (
              <div className={cx(innerRowClass, "flex items-center gap-3 p-2.5")}>
                <img src={selectedPose.image} alt="" className="w-12 h-16 object-cover rounded-lg" />
                <div className="flex-1 min-w-0 text-sm">
                  <p className="text-white font-medium">
                    {t(`common.apparatus.${apparatus}`)} · {t("pages.shop.checkout.steps.poseN", { n: selectedPose.no })}
                  </p>
                  {selectedPose.label && <p className="text-zinc-400 truncate">{selectedPose.label}</p>}
                </div>
                <button type="button" onClick={() => goStep(1)} className={buttonClass("link", "sm", "shrink-0")}>
                  {t("pages.shop.checkout.steps.change")}
                </button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-300">{t("pages.shop.checkout.quantity")}</span>
              <div className="flex items-center gap-2">
                <IconButton
                  icon={Minus}
                  label={t("checkout.cart.decrease")}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                />
                <span className="w-6 text-center text-white font-semibold" aria-live="polite">
                  {quantity}
                </span>
                <IconButton
                  icon={Plus}
                  label={t("checkout.cart.increase")}
                  onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
                  disabled={quantity >= MAX_QUANTITY}
                />
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>{t("pages.shop.checkout.shippingFee")}</span>
                <span className="text-emerald-400">{t("pages.shop.free")}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-white">
                <span>{t("pages.shop.total")}</span>
                <span>{formatTL(total)}</span>
              </div>
            </div>

            <Checkbox checked={accepted} onChange={(e) => setAccepted(e.target.checked)}>
              <a
                href={localized("/mesafeli-satis-sozlesmesi")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 underline"
              >
                {t("pages.shop.checkout.contract")}
              </a>{" "}
              {t("pages.shop.checkout.and")}{" "}
              <a
                href={localized("/iptal-ve-iade-kosullari")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 underline"
              >
                {t("pages.shop.checkout.returns")}
              </a>{" "}
              {t("pages.shop.checkout.acceptSuffix")}
            </Checkbox>
            <p className="text-sm text-zinc-400">{t("pages.shop.checkout.personalNotice")}</p>

            {error && <Alert tone="danger">{error}</Alert>}

            <Button type="submit" size="lg" loading={submitting} icon={ShoppingBag} className="w-full">
              {t("pages.shop.checkout.pay", { total: formatTL(total) })}
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-sm text-zinc-400">
              <Lock className="w-4 h-4" aria-hidden />
              {t("pages.shop.checkout.secure")}
            </p>
          </Card>
        </form>
        )}
        </div>
      </div>
    </div>
  );
};

export default ShopCheckoutPage;
