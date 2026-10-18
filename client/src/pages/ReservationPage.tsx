import { useState, useEffect } from "react";
import {
  Calendar,
  ArrowLeft,
  User,
  Phone,
  Building,
  CalendarDays,
  MessageSquare,
  Loader2,
  Check,
  Trash2,
  Plus,
  Package as PackageIcon,
  Mail,
} from "lucide-react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import LocalizedLink from "../components/LocalizedLink";
import { useLocalizedNavigate } from "../lib/localePath";
import { formatNumber } from "../lib/format";
import { motion } from "framer-motion";
import api from "../lib/api";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import SEO from "../components/SEO";
import Reveal from "../components/ui/Reveal";
import { APPARATUSES } from "../constants/apparatuses";
import { emptyCustomerForm, fillCustomerFormGaps } from "../lib/customerForm";
import AccountClaimCard, { type AccountInfo } from "../components/AccountClaimCard";
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

interface SelectedPackage {
  id: string;
  packageId: string;
  packageName: string;
  seriesCount: 1 | 2 | 3;
  quantity: number;
  price: number;
  apparatuses: string[];
  priority: boolean;
}

// Seri sayısına göre rezervasyon (elden nakit) fiyatı
const reservationPriceFor = (pkg: Package, seriesCount: 1 | 2 | 3) =>
  seriesCount === 1 ? pkg.reservationPrice : pkg.reservationDiscounts[seriesCount];

// Satır birim fiyatı: taban + (öncelikliyse seri başına ek ücret). Önizleme —
// asıl fiyatı backend aynı kuralla hesaplar (utils/items.js).
const rowPrice = (pkg: Package, seriesCount: 1 | 2 | 3, priority: boolean) =>
  reservationPriceFor(pkg, seriesCount) +
  (priority && pkg.priorityFee ? pkg.priorityFee * seriesCount : 0);

const ReservationPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useLocalizedNavigate();
  const [searchParams] = useSearchParams();
  const editParam = searchParams.get("duzenle");

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
  const [selectedPackages, setSelectedPackages] = useState<SelectedPackage[]>(
    [],
  );
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  // Başarı ekranı: rezervasyon no + hesap durumu (şifre belirleme kartı için)
  const [result, setResult] = useState<{
    reservationId: string;
    account: AccountInfo;
  } | null>(null);

  const [form, setForm] = useState(emptyCustomerForm);

  const [kvkkAccepted, setKvkkAccepted] = useState(false);

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

  useEffect(() => {
    fetchPackages();
    // Paket adları sunucudan dile göre gelir
  }, [i18n.language]);

  const fetchPackages = async () => {
    try {
      const { data } = await api.get("/api/packages");
      setPackages(data);
    } catch (error) {
      console.error("Failed to fetch packages:", error);
    } finally {
      setIsLoadingPackages(false);
    }
  };

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
            const seriesCount = item.seriesCount as 1 | 2 | 3;
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

  const addNewPackageRow = () => {
    const newId = `temp-${Date.now()}`;
    setSelectedPackages([
      ...selectedPackages,
      {
        id: newId,
        packageId: "",
        packageName: "",
        seriesCount: 1,
        quantity: 1,
        price: 0,
        apparatuses: [],
        priority: false,
      },
    ]);
  };

  const removePackageRow = (id: string) => {
    setSelectedPackages(selectedPackages.filter((sp) => sp.id !== id));
  };

  const updatePackageRow = (id: string, field: string, value: any) => {
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
            packageId: value,
            packageName: pkg.name,
            priority,
            price: rowPrice(pkg, sp.seriesCount, priority),
          };
        }
        if (field === "seriesCount") {
          const newCount = value as 1 | 2 | 3;
          return {
            ...sp,
            seriesCount: newCount,
            apparatuses: sp.apparatuses.slice(0, newCount),
            ...(pkg && { price: rowPrice(pkg, newCount, sp.priority) }),
          };
        }
        if (field === "priority") {
          return { ...sp, priority: value, ...(pkg && { price: rowPrice(pkg, sp.seriesCount, value) }) };
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    toast.dismiss();

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

    if (!selectedPackages || selectedPackages.length === 0) {
      setError(t("checkout.form.errors.noPackage"));
      return;
    }

    // Paket seçimi kontrolü
    const invalidPackages = selectedPackages.filter((sp) => !sp.packageId);
    if (invalidPackages.length > 0) {
      setError(t("checkout.form.errors.rowPackage"));
      return;
    }

    const incompleteRow = selectedPackages.find(
      (sp) => sp.apparatuses.length !== sp.seriesCount,
    );
    if (incompleteRow) {
      setError(t("checkout.form.errors.apparatus"));
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...form,
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
        account: data.account,
      });
      toast.success(t("checkout.reservation.toastCreated"));
    } catch (err: any) {
      setError(err.response?.data?.message || t("checkout.form.errors.generic"));
      toast.error(err.response?.data?.message || t("checkout.form.errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rezervasyonlar geçici olarak kapalı
  const isReservationsClosed = false;

  if (isReservationsClosed) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <SEO
          title={t("checkout.reservation.seoTitle")}
          description={t("checkout.reservation.seoDescription")}
        />
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[28rem] h-[28rem] bg-emerald-600/[0.05] rounded-full blur-3xl" />
        </div>
        <div className="text-center relative z-10">
          <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {t("checkout.reservation.closedTitle")}
          </h2>
          <p className="text-zinc-400 mb-6 max-w-md">
            {t("checkout.reservation.closedText")}
          </p>
          <LocalizedLink
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t("checkout.reservation.backHome")}
          </LocalizedLink>
        </div>
      </div>
    );
  }

  if (lockedReservation) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 py-24">
        <SEO title={t("checkout.reservation.seoTitle")} description={t("checkout.reservation.seoDescription")} />
        <div className="w-full max-w-md text-center bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{t("checkout.reservation.lockedTitle")}</h2>
          <p className="text-zinc-400 text-sm mb-6">
            {t("checkout.reservation.lockedText", { name: lockedReservation.athleteName })}
          </p>
          <LocalizedLink
            to="/profil"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors"
          >
            {t("checkout.reservation.viewMine")}
          </LocalizedLink>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 py-24">
        <div className="w-full max-w-md">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="relative w-24 h-24 mx-auto mb-6"
            >
              <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-2xl animate-pulse" />
              <div className="relative w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
                <Check className="w-12 h-12 text-emerald-400" />
              </div>
            </motion.div>
            <h2 className="text-2xl font-bold text-gradient-brand mb-2">
              {t("checkout.reservation.successTitle")}
            </h2>
            <p className="text-zinc-400 mb-3">
              {t("checkout.reservation.successText")}
            </p>
            <p className="text-xs text-zinc-600 font-mono break-all">
              {t("checkout.reservation.number", { id: result.reservationId })}
            </p>
          </div>

          <AccountClaimCard
            account={result.account}
            reservationId={result.reservationId}
          />

          <div className="text-center mt-6">
            <LocalizedLink
              to="/"
              className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("checkout.reservation.backHome")}
            </LocalizedLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-28 pb-16">
      <SEO
        title={t("checkout.reservation.seoTitle")}
        description={t("checkout.reservation.seoDescription")}
        keywords={t("checkout.reservation.seoKeywords")}
      />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[28rem] h-[28rem] bg-emerald-600/[0.05] rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10 max-w-6xl">
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
          <div className="flex items-center gap-4 mb-5">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-xl" />
              <div className="relative w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <Calendar className="w-7 h-7 text-emerald-400" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient-brand">
                {editingId ? t("checkout.reservation.editTitle") : t("checkout.reservation.newTitle")}
              </h1>
              <p className="text-zinc-500 text-sm">
                {editingId
                  ? t("checkout.reservation.editSubtitle")
                  : t("checkout.reservation.newSubtitle")}
              </p>
            </div>
          </div>
          <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-3xl mb-10">
            {t("checkout.reservation.intro")}
          </p>
        </Reveal>

        {/* Mevcut rezervasyonlar (kardeş için yeni rezervasyon yapılabilir) */}
        {!editingId && myActive.length > 0 && (
          <div className="mb-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl px-5 py-4">
            <p className="text-sm text-zinc-300 mb-2">{t("checkout.reservation.existing")}</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {myActive.map((r) =>
                isCustomerEditable(r.status) ? (
                  <LocalizedLink
                    key={r.id}
                    to={`/rezervasyon?duzenle=${r.id}`}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700 hover:border-emerald-500/50 text-sm text-white transition-colors"
                  >
                    {r.athleteName} <span className="text-emerald-400">· {t("checkout.reservation.edit")}</span>
                  </LocalizedLink>
                ) : (
                  <span
                    key={r.id}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700/60 text-sm text-zinc-400"
                  >
                    {r.athleteName} · {t("checkout.reservation.paid")}
                  </span>
                ),
              )}
            </div>
            <p className="text-xs text-zinc-500">
              {t("checkout.reservation.siblingHint")}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Paket Seçimi */}
          <Reveal delay={0.1}>
          <div className="relative bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
            <div className="absolute -top-px left-6 right-6 h-px bg-linear-to-r from-transparent via-emerald-500/40 to-transparent" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">{t("checkout.reservation.packages")}</h2>
              <button
                type="button"
                onClick={addNewPackageRow}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t("checkout.reservation.addPackage")}
              </button>
            </div>

            {isLoadingPackages ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {selectedPackages.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">
                    <PackageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>
                      {t("checkout.reservation.noPackages")}
                    </p>
                  </div>
                ) : (
                  selectedPackages.map((sp) => {
                    const selectedPkg = packages.find(
                      (p) => p.id === sp.packageId,
                    );
                    return (
                      <div
                        key={sp.id}
                        className="grid md:grid-cols-12 gap-3 p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl"
                      >
                        {/* Paket Seçimi */}
                        <div className="md:col-span-4">
                          <label className="text-xs text-zinc-500 mb-1 block">
                            {t("checkout.reservation.package")}
                          </label>
                          <select
                            value={sp.packageId}
                            onChange={(e) =>
                              updatePackageRow(
                                sp.id,
                                "packageId",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                          >
                            <option value="">{t("checkout.reservation.choosePackage")}</option>
                            {packages.map((pkg) => (
                              <option key={pkg.id} value={pkg.id}>
                                {pkg.name} - ₺
                                {formatNumber(pkg.reservationPrice)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Seri Sayısı */}
                        <div className="md:col-span-3">
                          <label className="text-xs text-zinc-500 mb-1 block">
                            {t("checkout.reservation.seriesCount")}
                          </label>
                          <select
                            value={sp.seriesCount}
                            onChange={(e) =>
                              updatePackageRow(
                                sp.id,
                                "seriesCount",
                                Number(e.target.value),
                              )
                            }
                            disabled={!sp.packageId}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value={1}>
                              {t("common.series", { count: 1 })} - ₺
                              {formatNumber(selectedPkg?.reservationPrice || 0)}
                            </option>
                            <option value={2}>
                              {t("common.series", { count: 2 })} - ₺
                              {formatNumber(selectedPkg?.reservationDiscounts?.[2] || 0)}
                            </option>
                            <option value={3}>
                              {t("common.series", { count: 3 })} - ₺
                              {formatNumber(selectedPkg?.reservationDiscounts?.[3] || 0)}
                            </option>
                          </select>
                        </div>

                        {/* Adet */}
                        <div className="md:col-span-2">
                          <label className="text-xs text-zinc-500 mb-1 block">
                            {t("checkout.reservation.quantity")}
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={sp.quantity}
                            onChange={(e) =>
                              updatePackageRow(
                                sp.id,
                                "quantity",
                                Number(e.target.value),
                              )
                            }
                            disabled={!sp.packageId}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>

                        {/* Toplam */}
                        <div className="md:col-span-2 flex flex-col justify-end">
                          <label className="text-xs text-zinc-500 mb-1 block">
                            {t("checkout.form.total")}
                          </label>
                          <div className="text-base font-bold text-emerald-400">
                            ₺{formatNumber(sp.price * sp.quantity)}
                          </div>
                        </div>

                        {/* Sil */}
                        <div className="md:col-span-1 flex items-end justify-end">
                          <button
                            type="button"
                            onClick={() => removePackageRow(sp.id)}
                            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Öncelikli (pakette öncelik ücreti tanımlıysa) */}
                        {selectedPkg?.priorityFee != null && (
                          <PriorityCheckbox
                            className="md:col-span-12"
                            checked={sp.priority}
                            onChange={(checked) => updatePackageRow(sp.id, "priority", checked)}
                            fee={selectedPkg.priorityFee}
                          />
                        )}

                        {/* Alet seçimi (seriesCount kadar zorunlu) */}
                        <div className="md:col-span-12 mt-1">
                          <label className="text-xs text-zinc-500 mb-2 block">
                            {t("checkout.apparatus.label")}{" "}
                            <span className="text-red-400">*</span>
                            <span className="ml-1 text-zinc-600">
                              {t("checkout.apparatus.selected", { count: sp.apparatuses.length, total: sp.seriesCount })}
                            </span>
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {APPARATUSES.map((a) => {
                              const active = sp.apparatuses.includes(a.slug);
                              const slotsFull =
                                !active &&
                                sp.apparatuses.length >= sp.seriesCount;
                              return (
                                <button
                                  key={a.slug}
                                  type="button"
                                  disabled={!sp.packageId || slotsFull}
                                  onClick={() =>
                                    toggleApparatusOnRow(sp.id, a.slug)
                                  }
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                    active
                                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                                      : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500"
                                  }`}
                                >
                                  {t(`common.apparatus.${a.slug}`)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
          </Reveal>

          {/* Sporcu Bilgileri */}
          <Reveal delay={0.15}>
          <div className="relative bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
            <div className="absolute -top-px left-6 right-6 h-px bg-linear-to-r from-transparent via-emerald-500/40 to-transparent" />
            <h2 className="text-xl font-semibold text-white mb-4">
              {t("checkout.reservation.athleteInfo")}
            </h2>
            {isAuthenticated && !editingId && (
              <p className="-mt-2 mb-4 text-xs text-zinc-500">
                {t("checkout.reservation.siblingFormHint")}
              </p>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
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

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                  <Mail className="w-4 h-4" />
                  {t("checkout.form.email")} <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  name="customerEmail"
                  value={form.customerEmail}
                  onChange={handleChange}
                  readOnly={!!editingId}
                  placeholder="ornek@gmail.com"
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors read-only:opacity-60 read-only:cursor-not-allowed"
                />
                {editingId && (
                  <p className="text-xs text-zinc-500 mt-1">
                    {t("checkout.form.emailLocked")}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
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
            </div>
          </div>
          </Reveal>

          {/* Özet ve Gönder */}
          <Reveal delay={0.2}>
          <div className="relative bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
            <div className="absolute -top-px left-6 right-6 h-px bg-linear-to-r from-transparent via-emerald-500/40 to-transparent" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {t("checkout.form.totalAmount")}
                </h3>
                <p className="text-sm text-zinc-500">
                  {t("checkout.reservation.packagesSelected", { count: selectedPackages.length })}
                </p>
              </div>
              <div className="text-3xl font-bold text-gradient-brand">
                {formatTL(discountedTotal)}
              </div>
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

            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-xs text-amber-400 text-center">
                {t("checkout.reservation.payAtVenue")}
              </p>
            </div>

            {/* Hesap bağlama bilgisi */}
            {isAuthenticated ? (
              <div className="mb-4 flex items-start gap-2 text-sm text-emerald-400/90 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3">
                <Check className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{t("checkout.form.accountLinked")}</span>
              </div>
            ) : (
              <div className="mb-4 flex items-start gap-2 text-sm text-zinc-400 bg-zinc-800/40 border border-zinc-700/50 rounded-xl px-4 py-3">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
                <span>
                  {t("checkout.form.accountNewReservation")}
                </span>
              </div>
            )}

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
                  <LocalizedLink
                    to="/kvkk-aydinlatma-metni"
                    target="_blank"
                    className="text-emerald-400 hover:text-emerald-300 underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t("checkout.form.kvkkLink")}
                  </LocalizedLink>
                  {t("checkout.form.kvkkSuffix")}{" "}
                  <span className="text-red-400">*</span>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                selectedPackages.length === 0 ||
                selectedPackages.some(
                  (sp) => sp.apparatuses.length !== sp.seriesCount,
                ) ||
                !kvkkAccepted
              }
              className="w-full py-4 px-6 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("checkout.form.processing")}
                </>
              ) : (
                <>
                  <Calendar className="w-5 h-5" />
                  {editingId ? t("checkout.reservation.submitUpdate") : t("checkout.reservation.submitCreate")}
                </>
              )}
            </button>
          </div>
          </Reveal>
        </form>
      </div>
    </div>
  );
};

export default ReservationPage;
