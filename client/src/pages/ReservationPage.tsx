import { useState, useEffect, useRef } from "react";
import { Calendar, Check, Trash2, Plus, Trophy, CalendarX, CreditCard } from "lucide-react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import LocalizedLink from "../components/LocalizedLink";
import { useLocalizedNavigate } from "../lib/localePath";
import api from "../lib/api";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import SEO from "../components/SEO";
import {
  emptyCustomerForm,
  fillCustomerFormGaps,
  focusFirstError,
  validateCustomerForm,
  type CustomerFormErrors,
} from "../lib/customerForm";
import AccountClaimCard, { type AccountInfo } from "../components/AccountClaimCard";
import CustomerFields from "../components/checkout/CustomerFields";
import ApparatusPicker from "../components/checkout/ApparatusPicker";
import KvkkCheckbox from "../components/checkout/KvkkCheckbox";
import WhatsAppIcon from "../components/ui/WhatsAppIcon";
import {
  Alert,
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  IconButton,
  Input,
  PageHeader,
  Select,
  Spinner,
} from "../components/ui/kit";
import { ROLES } from "../lib/roles";
import { useMyLoyalty } from "../hooks/useMyLoyalty";
import LoyaltyPriceLines from "../components/LoyaltyPriceLines";
import PriorityCheckbox from "../components/PriorityCheckbox";
import { applyDiscount, formatTL, pointsFor } from "../lib/loyalty";
import {
  ACTIVE_RESERVATION_STATUSES,
  isCustomerEditable,
  type MyReservation,
} from "../lib/myReservations";
import { useTournaments } from "../lib/tournaments";
import { whatsappUrl } from "../lib/contact";
import {
  buttonClass,
  containerClass,
  cx,
  innerRowClass,
  pageClass,
  pillClass,
  widthGrid,
  widthForm,
} from "../lib/siteUi";

interface Package {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  features: string[];
  discounts: {
    2: number;
    3: number;
  };
  // Rezervasyon fiyatları (elden nakit için)
  reservationPrice: number;
  reservationDiscounts: {
    2: number;
    3: number;
  };
  loyaltyPoints?: number;
  // Öncelikli ek ücreti (seri başına); null = bu pakette öncelik yok
  priorityFee?: number | null;
}

type Series = 1 | 2 | 3;

interface SelectedPackage {
  id: string;
  packageId: string;
  packageName: string;
  seriesCount: Series;
  quantity: number;
  price: number;
  apparatuses: string[];
  priority: boolean;
}

const FORM_ID = "reservation";

// Seri sayısına göre rezervasyon (elden nakit) fiyatı
const reservationPriceFor = (pkg: Package, seriesCount: Series) =>
  seriesCount === 1 ? pkg.reservationPrice : pkg.reservationDiscounts[seriesCount];

// Satır birim fiyatı: taban + (öncelikliyse seri başına ek ücret). Önizleme —
// asıl fiyatı backend aynı kuralla hesaplar (utils/items.js).
const rowPrice = (pkg: Package, seriesCount: Series, priority: boolean) =>
  reservationPriceFor(pkg, seriesCount) +
  (priority && pkg.priorityFee ? pkg.priorityFee * seriesCount : 0);

const emptyRow = (): SelectedPackage => ({
  id: `temp-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
  packageId: "",
  packageName: "",
  seriesCount: 1,
  quantity: 1,
  price: 0,
  apparatuses: [],
  priority: false,
});

const toSeries = (value: string | null): Series => (value === "2" ? 2 : value === "3" ? 3 : 1);

const ReservationPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useLocalizedNavigate();
  const [searchParams] = useSearchParams();
  const editParam = searchParams.get("duzenle");
  // Paket kartından gelindiyse (?paket=slug&seri=n) ilk satır hazır gelir
  const presetPackage = searchParams.get("paket");
  const presetSeries = toSeries(searchParams.get("seri"));

  // Sporcu başına tek rezervasyon: veli kardeşler için ayrı rezervasyon yapabilir.
  // Form varsayılan olarak YENİ rezervasyon; düzenleme sadece ?duzenle=id ile açılır.
  // editingId → PUT /my/:id; lockedReservation → ödeme sonrası, form yerine bilgi.
  // myActive → formun üstünde "mevcut rezervasyonlarınız" listesi.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [myActive, setMyActive] = useState<MyReservation[]>([]);
  const [lockedReservation, setLockedReservation] = useState<MyReservation | null>(null);
  // Düzenlemede rezervasyonun oluşturulduğu andaki indirim yüzdesi kullanılır
  const [editDiscountPercent, setEditDiscountPercent] = useState(0);
  const loyalty = useMyLoyalty();

  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<SelectedPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [packagesFailed, setPackagesFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hatalar: alan bazlı (fieldErrors), paket satırları (rowsError), KVKK ve sunucu
  const [fieldErrors, setFieldErrors] = useState<CustomerFormErrors>({});
  const [rowsError, setRowsError] = useState("");
  const [kvkkError, setKvkkError] = useState(false);
  const [serverError, setServerError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const packagesCardRef = useRef<HTMLDivElement>(null);

  // Başarı ekranı: rezervasyon no + ödenecek tutar + hesap durumu (şifre belirleme kartı için)
  const [result, setResult] = useState<{
    reservationId: string;
    tournamentName?: string;
    total: number;
    account: AccountInfo;
  } | null>(null);

  const [form, setForm] = useState(emptyCustomerForm);

  const [kvkkAccepted, setKvkkAccepted] = useState(false);

  // Yarışma: rezervasyon açık yarışmaya yapılır (genelde tek → otomatik). Birden çok açıksa
  // müşteri seçer. Düzenlemede rezervasyonun kendi yarışması (değiştirilemez).
  const { open: openTournaments, loading: tournamentsLoading } = useTournaments();
  const [pickedTournamentId, setPickedTournamentId] = useState<string | null>(null);
  const [editingTournament, setEditingTournament] = useState<MyReservation["tournament"]>(null);
  const bookingTournament = editingId
    ? editingTournament
    : openTournaments.length === 1
      ? openTournaments[0]
      : (openTournaments.find((tr) => tr.id === pickedTournamentId) ?? null);

  // Girişli kullanıcının profilinden boş alanları ön-doldur (yazılmış değeri ezme).
  // Sporcu adı da dolar: çekim listesi eşleşmesi tam isim eşitliğine bakıyor, her
  // seferinde elle yazılması yazım farkı yüzünden eşleşmeyi düşürüyordu.
  useEffect(() => {
    if (!user) return;
    setForm((prev) => fillCustomerFormGaps(prev, user));
  }, [user]);

  const toggleApparatusOnRow = (rowId: string, slug: string) => {
    setSelectedPackages((prev) =>
      prev.map((sp) => {
        if (sp.id !== rowId) return sp;
        const exists = sp.apparatuses.includes(slug);
        if (exists) {
          return { ...sp, apparatuses: sp.apparatuses.filter((s) => s !== slug) };
        }
        // Slot dolu mu kontrol et
        if (sp.apparatuses.length >= sp.seriesCount) return sp;
        return { ...sp, apparatuses: [...sp.apparatuses, slug] };
      }),
    );
  };

  const fetchPackages = async () => {
    setIsLoadingPackages(true);
    setPackagesFailed(false);
    try {
      const { data } = await api.get("/api/packages");
      setPackages(data);
    } catch (error) {
      console.error("Failed to fetch packages:", error);
      setPackagesFailed(true);
    } finally {
      setIsLoadingPackages(false);
    }
  };

  useEffect(() => {
    fetchPackages();
    // Paket adları sunucudan dile göre gelir
  }, [i18n.language]);

  // Yeni rezervasyon formu hiç boş açılmaz: paket kartından gelindiyse o paket,
  // değilse seçilmeyi bekleyen tek bir satır. Düzenlemede satırlar kayıttan gelir.
  const rowsInitialized = useRef(false);
  useEffect(() => {
    if (rowsInitialized.current || editParam || packages.length === 0) return;
    rowsInitialized.current = true;
    const preset = presetPackage ? packages.find((p) => p.id === presetPackage) : undefined;
    setSelectedPackages([
      preset
        ? {
            ...emptyRow(),
            packageId: preset.id,
            packageName: preset.name,
            seriesCount: presetSeries,
            price: rowPrice(preset, presetSeries, false),
          }
        : emptyRow(),
    ]);
  }, [packages, editParam, presetPackage, presetSeries]);

  useEffect(() => {
    if (user?.role !== ROLES.CUSTOMER || packages.length === 0) return;
    let cancelled = false;

    api
      .get("/api/reservations/my")
      .then(({ data }) => {
        if (cancelled) return;
        const mine: MyReservation[] = data.data || [];
        setMyActive(mine.filter((r) => ACTIVE_RESERVATION_STATUSES.includes(r.status)));

        // Düzenleme yalnızca profildeki "Düzenle" bağlantısıyla (?duzenle=id)
        const target = editParam ? mine.find((r) => r.id === editParam) : undefined;
        if (!target || !ACTIVE_RESERVATION_STATUSES.includes(target.status)) {
          setEditingId(null);
          setLockedReservation(null);
          return;
        }

        if (!isCustomerEditable(target.status)) {
          setLockedReservation(target);
          return;
        }

        setEditingId(target.id);
        setEditingTournament(target.tournament ?? null);
        setEditDiscountPercent(target.discountPercent || 0);
        setKvkkAccepted(true); // ilk rezervasyonda zaten onaylandı
        setForm({
          athleteName: target.athleteName,
          clubName: target.clubName,
          birthYear: target.birthYear,
          customerPhone: target.customerPhone,
          customerEmail: target.customerEmail,
          notes: target.notes || "",
        });
        setSelectedPackages(
          target.items.map((item, index) => {
            const pkg = packages.find((p) => p.id === item.package.id);
            const seriesCount = item.seriesCount as Series;
            const priority = !!item.priority && pkg?.priorityFee != null;
            return {
              id: `edit-${index}`,
              // Paket artık satışta değilse boş bırak — müşteri yenisini seçer
              packageId: pkg ? pkg.id : "",
              packageName: pkg ? pkg.name : "",
              seriesCount,
              quantity: item.quantity,
              price: pkg ? rowPrice(pkg, seriesCount, priority) : 0,
              apparatuses: item.apparatuses,
              priority,
            };
          }),
        );
      })
      .catch((err) => console.error("Rezervasyonunuz yüklenemedi:", err));

    return () => {
      cancelled = true;
    };
  }, [user, packages, editParam]);

  const addNewPackageRow = () => setSelectedPackages((prev) => [...prev, emptyRow()]);

  const removePackageRow = (id: string) => {
    setSelectedPackages(selectedPackages.filter((sp) => sp.id !== id));
  };

  const updatePackageRow = (id: string, field: string, value: string | number | boolean) => {
    setSelectedPackages(
      selectedPackages.map((sp) => {
        if (sp.id !== id) return sp;
        const pkg = packages.find((p) => p.id === (field === "packageId" ? value : sp.packageId));

        if (field === "packageId") {
          if (!pkg) return sp;
          // Yeni pakette öncelik yoksa (ör. Full Event) seçim düşer
          const priority = sp.priority && pkg.priorityFee != null;
          return {
            ...sp,
            packageId: pkg.id,
            packageName: pkg.name,
            priority,
            price: rowPrice(pkg, sp.seriesCount, priority),
          };
        }
        if (field === "seriesCount") {
          const newCount = value as Series;
          return {
            ...sp,
            seriesCount: newCount,
            apparatuses: sp.apparatuses.slice(0, newCount),
            ...(pkg && { price: rowPrice(pkg, newCount, sp.priority) }),
          };
        }
        if (field === "priority") {
          const priority = value as boolean;
          return { ...sp, priority, ...(pkg && { price: rowPrice(pkg, sp.seriesCount, priority) }) };
        }
        return { ...sp, [field]: value };
      }),
    );
  };

  const calculateTotal = () => {
    return selectedPackages.reduce((total, sp) => {
      return total + sp.price * sp.quantity;
    }, 0);
  };

  // Sadakat önizlemesi (asıl hesap backend'de)
  const subtotal = calculateTotal();
  const discountPercent = editingId ? editDiscountPercent : (loyalty?.tier?.discountPercent ?? 0);
  const { totalPrice: discountedTotal } = applyDiscount(subtotal, discountPercent);
  const earnPoints = selectedPackages.reduce((sum, sp) => {
    const pkg = packages.find((p) => p.id === sp.packageId);
    return sum + pointsFor(pkg?.loyaltyPoints, sp.seriesCount, sp.quantity);
  }, 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Yazmaya başlayınca o alanın hatası kalkar
    if (fieldErrors[name as keyof CustomerFormErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Paket satırlarındaki eksik: mesajı döner (boş = tamam)
  const validateRows = () => {
    if (!editingId && !bookingTournament) return t("checkout.tournament.choose");
    if (selectedPackages.length === 0) return t("checkout.form.errors.noPackage");
    if (selectedPackages.some((sp) => !sp.packageId)) return t("checkout.form.errors.rowPackage");
    if (selectedPackages.some((sp) => sp.apparatuses.length !== sp.seriesCount))
      return t("checkout.form.errors.apparatus");
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setSubmitted(true);
    toast.dismiss();

    const rowsProblem = validateRows();
    const errors = validateCustomerForm(form, t);
    setRowsError(rowsProblem);
    setFieldErrors(errors);
    setKvkkError(!kvkkAccepted);

    // İlk eksik olan yere götür: önce paketler, sonra form alanları
    if (rowsProblem) {
      packagesCardRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      return;
    }
    if (Object.keys(errors).length > 0) {
      focusFirstError(errors, FORM_ID);
      return;
    }
    if (!kvkkAccepted) return;

    setIsSubmitting(true);

    try {
      const payload = {
        ...form,
        // Yarışma yalnızca yeni rezervasyonda gönderilir (düzenlemede değişmez)
        ...(!editingId && bookingTournament && { tournamentId: bookingTournament.id }),
        items: selectedPackages.map((sp) => {
          const pkg = packages.find((p) => p.id === sp.packageId);
          if (!pkg) {
            throw new Error(`Paket bulunamadı: ${sp.packageId}`);
          }
          return {
            package: {
              id: pkg.id,
              name: pkg.name,
              category: pkg.category,
              reservationPrice: pkg.reservationPrice,
              reservationDiscounts: pkg.reservationDiscounts,
            },
            seriesCount: sp.seriesCount,
            quantity: sp.quantity,
            apparatuses: sp.apparatuses,
            priority: sp.priority,
          };
        }),
        totalPrice: calculateTotal(),
      };

      if (editingId) {
        await api.put(`/api/reservations/my/${editingId}`, payload);
        toast.success(t("checkout.reservation.toastUpdated"));
        navigate("/profil");
        return;
      }

      const { data } = await api.post("/api/reservations", payload);

      // Başarılı. Otomatik ana sayfa yönlendirmesi YOK — müşteri bu ekranda
      // şifresini belirleyip hesabına giriyor.
      setResult({
        reservationId: data.reservation.id,
        tournamentName: data.reservation.tournament?.name,
        total: data.reservation.totalPrice ?? discountedTotal,
        account: data.account,
      });
      window.scrollTo({ top: 0 });
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setServerError(message || t("checkout.form.errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // "Mevcut rezervasyonlarınız": yalnızca bu yarışmanınkiler (geçmiş yarışmalar profilde)
  const myActiveHere = bookingTournament
    ? myActive.filter((r) => r.tournament?.id === bookingTournament.id)
    : [];

  // Rezervasyona açık yarışma yoksa form yerine bilgi + WhatsApp (düzenleme bağlantısı hariç)
  const isReservationsClosed = !editParam && !tournamentsLoading && openTournaments.length === 0;

  const seo = (
    <SEO
      title={t("checkout.reservation.seoTitle")}
      description={t("checkout.reservation.seoDescription")}
      keywords={t("checkout.reservation.seoKeywords")}
    />
  );

  if (isReservationsClosed) {
    return (
      <div className={pageClass}>
        {seo}
        <div className={containerClass}>
          <EmptyState
            icon={CalendarX}
            title={t("checkout.reservation.closedTitle")}
            description={t("checkout.reservation.closedText")}
            className={cx(widthForm, "mt-10")}
          >
            <a
              href={whatsappUrl(t("common.whatsapp.message"))}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("primary")}
            >
              <WhatsAppIcon className="w-4 h-4" />
              {t("checkout.reservation.closedContact")}
            </a>
            <LocalizedLink to="/paketler" className={buttonClass("secondary")}>
              {t("checkout.cart.browse")}
            </LocalizedLink>
          </EmptyState>
        </div>
      </div>
    );
  }

  if (lockedReservation) {
    return (
      <div className={pageClass}>
        {seo}
        <div className={containerClass}>
          <EmptyState
            icon={Check}
            title={t("checkout.reservation.lockedTitle")}
            description={t("checkout.reservation.lockedText", { name: lockedReservation.athleteName })}
            className={cx(widthForm, "mt-10")}
          >
            <LocalizedLink to="/profil" className={buttonClass("primary")}>
              {t("checkout.reservation.viewMine")}
            </LocalizedLink>
          </EmptyState>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className={pageClass}>
        <div className={containerClass}>
          <div className={cx(widthForm, "mt-6")}>
            <Card padding="lg" className="text-center">
              <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-400 mb-4">
                <Check className="w-7 h-7" aria-hidden />
              </span>
              <h1 className="text-2xl font-bold text-white">{t("checkout.reservation.successTitle")}</h1>
              <p className="mt-2 text-zinc-300">{t("checkout.reservation.successText")}</p>

              <dl className={cx(innerRowClass, "mt-6 divide-y divide-zinc-700/60 text-left")}>
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="text-zinc-400">{t("checkout.reservation.amountDue")}</dt>
                  <dd className="text-xl font-bold text-white">{formatTL(result.total)}</dd>
                </div>
                {result.tournamentName && (
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <dt className="text-zinc-400">{t("checkout.tournament.short")}</dt>
                    <dd className="font-medium text-zinc-100 text-right">{result.tournamentName}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="text-zinc-400">{t("checkout.reservation.numberLabel")}</dt>
                  <dd className="font-mono font-medium text-zinc-100">
                    #{result.reservationId.slice(-8).toUpperCase()}
                  </dd>
                </div>
              </dl>
            </Card>

            <AccountClaimCard account={result.account} reservationId={result.reservationId} />

            <div className="text-center mt-6">
              <LocalizedLink to="/" className={buttonClass("ghost")}>
                {t("checkout.reservation.backHome")}
              </LocalizedLink>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={pageClass}>
      {seo}

      <div className={containerClass}>
        <div className={widthGrid}>
          <PageHeader
            backTo={editingId ? "/profil" : "/paketler"}
            backLabel={editingId ? t("common.nav.account") : t("common.nav.packages")}
            title={editingId ? t("checkout.reservation.editTitle") : t("checkout.reservation.newTitle")}
            subtitle={editingId ? t("checkout.reservation.editSubtitle") : t("checkout.reservation.intro")}
          />

          {/* Geniş ekranda iki sütun (sepet sayfasıyla aynı): solda form, sağda sabit özet */}
          <form onSubmit={handleSubmit} noValidate className="grid lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* Hangi yarışma için: tek açık yarışma (ya da düzenlenen kaydın yarışması) bilgi olarak,
              birden çok açıksa seçim */}
          {!editingId && openTournaments.length > 1 ? (
            <div>
              <p id="tournament-choice" className="text-sm font-medium text-zinc-300 mb-2">
                {t("checkout.tournament.choose")}
              </p>
              <div role="group" aria-labelledby="tournament-choice" className="flex flex-wrap gap-2">
                {openTournaments.map((tr) => (
                  <Chip
                    key={tr.id}
                    active={bookingTournament?.id === tr.id}
                    onClick={() => setPickedTournamentId(tr.id)}
                    className="flex-col items-start gap-0 py-2 text-left"
                  >
                    <span>{tr.name}</span>
                    <span className="text-xs font-normal text-zinc-400">{tr.date}</span>
                  </Chip>
                ))}
              </div>
            </div>
          ) : (
            bookingTournament && (
              <div className={cx(innerRowClass, "flex items-center gap-3 px-4 py-3")}>
                <Trophy className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden />
                <p className="text-sm">
                  <span className="text-zinc-400">{t("checkout.tournament.short")}: </span>
                  <span className="font-semibold text-white">{bookingTournament.name}</span>
                  {bookingTournament.date && <span className="text-zinc-400"> · {bookingTournament.date}</span>}
                </p>
              </div>
            )
          )}

          {/* Ödeme bilgisi + diğer yol (online ödeme) */}
          {!editingId && (
            <Alert tone="info" icon={CreditCard}>
              <p>{t("checkout.reservation.payAtVenue")}</p>
              <p>
                {t("checkout.reservation.onlineHint")}{" "}
                <LocalizedLink to="/paketler" className="text-emerald-400 hover:text-emerald-300 underline">
                  {t("checkout.reservation.onlineLink")}
                </LocalizedLink>
              </p>
            </Alert>
          )}

          {/* Mevcut rezervasyonlar (kardeş için yeni rezervasyon yapılabilir) */}
          {!editingId && myActiveHere.length > 0 && (
            <Card>
              <p className="text-sm font-medium text-zinc-300 mb-3">{t("checkout.reservation.existing")}</p>
              <ul className="flex flex-wrap gap-2 mb-3">
                {myActiveHere.map((r) => (
                  <li key={r.id}>
                    {isCustomerEditable(r.status) ? (
                      <LocalizedLink
                        to={`/rezervasyon?duzenle=${r.id}`}
                        className={buttonClass("secondary", "sm")}
                      >
                        {r.athleteName}
                        <span className="text-emerald-400 font-normal">· {t("checkout.reservation.edit")}</span>
                      </LocalizedLink>
                    ) : (
                      <span className={pillClass("success", "min-h-10 px-3 text-sm")}>
                        {r.athleteName} · {t("checkout.reservation.paid")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-zinc-400">{t("checkout.reservation.siblingHint")}</p>
            </Card>
          )}

            {/* 1 — Paket seçimi */}
            <Card ref={packagesCardRef} className="scroll-mt-28">
              <h2 className="text-xl font-semibold text-white mb-4">{t("checkout.reservation.packages")}</h2>

              {rowsError && (
                <Alert tone="danger" className="mb-4">
                  {rowsError}
                </Alert>
              )}

              {isLoadingPackages ? (
                <Spinner label={t("common.loading")} />
              ) : packagesFailed ? (
                <div className="text-center py-4">
                  <Alert tone="danger" className="text-left mb-4">
                    {t("home.packages.loadError")}
                  </Alert>
                  <Button variant="secondary" onClick={fetchPackages}>
                    {t("common.retry")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedPackages.map((sp, index) => {
                    const selectedPkg = packages.find((p) => p.id === sp.packageId);
                    const rowId = `row-${sp.id}`;
                    return (
                      <fieldset key={sp.id} className={cx(innerRowClass, "p-4 space-y-4")}>
                        <legend className="sr-only">
                          {t("checkout.reservation.package")} {index + 1}
                        </legend>
                        <div className="grid sm:grid-cols-12 gap-3 items-end">
                          <Field
                            className="sm:col-span-6"
                            label={t("checkout.reservation.package")}
                            htmlFor={`${rowId}-package`}
                            required
                          >
                            <Select
                              id={`${rowId}-package`}
                              value={sp.packageId}
                              onChange={(e) => updatePackageRow(sp.id, "packageId", e.target.value)}
                              invalid={submitted && !sp.packageId}
                            >
                              <option value="">{t("checkout.reservation.choosePackage")}</option>
                              {packages.map((pkg) => (
                                <option key={pkg.id} value={pkg.id}>
                                  {pkg.name} — {formatTL(pkg.reservationPrice)}
                                </option>
                              ))}
                            </Select>
                          </Field>

                          <Field
                            className="sm:col-span-3"
                            label={t("checkout.reservation.seriesCount")}
                            htmlFor={`${rowId}-series`}
                          >
                            <Select
                              id={`${rowId}-series`}
                              value={sp.seriesCount}
                              onChange={(e) => updatePackageRow(sp.id, "seriesCount", Number(e.target.value))}
                              disabled={!selectedPkg}
                            >
                              {([1, 2, 3] as const).map((n) => (
                                <option key={n} value={n}>
                                  {t("common.series", { count: n })}
                                  {selectedPkg ? ` — ${formatTL(reservationPriceFor(selectedPkg, n))}` : ""}
                                </option>
                              ))}
                            </Select>
                          </Field>

                          <Field
                            className="sm:col-span-2"
                            label={t("checkout.reservation.quantity")}
                            htmlFor={`${rowId}-quantity`}
                          >
                            <Input
                              id={`${rowId}-quantity`}
                              type="number"
                              min={1}
                              inputMode="numeric"
                              value={sp.quantity}
                              onChange={(e) =>
                                updatePackageRow(sp.id, "quantity", Math.max(1, Number(e.target.value) || 1))
                              }
                              disabled={!selectedPkg}
                            />
                          </Field>

                          <div className="sm:col-span-1 flex justify-end">
                            <IconButton
                              variant="ghost"
                              icon={Trash2}
                              label={t("checkout.reservation.removePackage")}
                              onClick={() => removePackageRow(sp.id)}
                              disabled={selectedPackages.length === 1}
                            />
                          </div>
                        </div>

                        {/* Öncelikli (pakette öncelik ücreti tanımlıysa) */}
                        {selectedPkg?.priorityFee != null && (
                          <PriorityCheckbox
                            checked={sp.priority}
                            onChange={(checked) => updatePackageRow(sp.id, "priority", checked)}
                            fee={selectedPkg.priorityFee}
                          />
                        )}

                        {/* Alet seçimi (seri sayısı kadar zorunlu) */}
                        <ApparatusPicker
                          selected={sp.apparatuses}
                          max={sp.seriesCount}
                          disabled={!selectedPkg}
                          showError={submitted}
                          onToggle={(slug) => toggleApparatusOnRow(sp.id, slug)}
                        />

                        {selectedPkg && (
                          <p className="flex items-center justify-between border-t border-zinc-700/60 pt-3 text-sm">
                            <span className="text-zinc-400">{t("checkout.form.total")}</span>
                            <span className="text-lg font-bold text-white">
                              {formatTL(sp.price * sp.quantity)}
                            </span>
                          </p>
                        )}
                      </fieldset>
                    );
                  })}

                  <Button variant="secondary" icon={Plus} onClick={addNewPackageRow}>
                    {t("checkout.reservation.addPackage")}
                  </Button>
                </div>
              )}
            </Card>

            {/* 2 — Sporcu bilgileri */}
            <Card>
              <h2 className="text-xl font-semibold text-white">{t("checkout.reservation.athleteInfo")}</h2>
              <p className="mt-1 mb-5 text-sm text-zinc-400">
                {isAuthenticated && !editingId
                  ? t("checkout.reservation.siblingFormHint")
                  : t("checkout.form.nameHint")}
              </p>

              <CustomerFields
                idPrefix={FORM_ID}
                form={form}
                errors={fieldErrors}
                onChange={handleChange}
                emailLocked={!!editingId}
              />
            </Card>

          </div>

            {/* 3 — Özet ve gönder (geniş ekranda kaydırırken sabit) */}
            <Card className="lg:sticky lg:top-28">
              <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">{t("checkout.form.totalAmount")}</h2>
                  <p className="text-sm text-zinc-400">{t("checkout.reservation.payAtVenueShort")}</p>
                </div>
                <p className="text-3xl font-bold text-white">{formatTL(discountedTotal)}</p>
              </div>

              <LoyaltyPriceLines
                subtotal={subtotal}
                discountPercent={discountPercent}
                tierName={editingId ? null : loyalty?.tier?.name}
                redeemPoints={editingId ? 0 : (loyalty?.tier?.minPoints ?? 0)}
                earnPoints={earnPoints}
                isGuest={!isAuthenticated}
                loginRedirect="/rezervasyon"
              />

              <p className="mb-5 text-sm text-zinc-400">
                {isAuthenticated ? t("checkout.form.accountLinked") : t("checkout.form.accountNewReservation")}
              </p>

              <KvkkCheckbox
                checked={kvkkAccepted}
                onChange={(checked) => {
                  setKvkkAccepted(checked);
                  if (checked) setKvkkError(false);
                }}
              />
              {kvkkError && <p className="mt-1.5 text-sm text-red-400">{t("checkout.form.errors.kvkk")}</p>}

              {serverError && (
                <Alert tone="danger" className="mt-5">
                  {serverError}
                </Alert>
              )}
              {submitted && !serverError && (rowsError || Object.values(fieldErrors).some(Boolean)) && (
                <Alert tone="danger" className="mt-5">
                  {t("checkout.form.errors.fix")}
                </Alert>
              )}

              <Button type="submit" size="lg" loading={isSubmitting} icon={Calendar} className="w-full mt-5">
                {isSubmitting
                  ? t("checkout.form.processing")
                  : editingId
                    ? t("checkout.reservation.submitUpdate")
                    : t("checkout.reservation.submitCreate")}
              </Button>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReservationPage;
