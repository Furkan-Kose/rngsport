import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import LocalizedLink from "../components/LocalizedLink";
import { useLocalizedNavigate } from "../lib/localePath";
import { formatDate, formatNumber } from "../lib/format";
import { motion } from "framer-motion";
import {
  Images,
  Calendar,
  ChevronRight,
  ChevronDown,
  Package,
  Lock,
  MailWarning,
  Pencil,
  Trash2,
  Loader2,
  RotateCw,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import SEO from "../components/SEO";
import ProfileCard from "../components/ProfileCard";
import LoyaltyCard from "../components/LoyaltyCard";
import { useMyLoyalty } from "../hooks/useMyLoyalty";
import { isCustomerEditable } from "../lib/myReservations";
import PriorityBadge from '../components/PriorityBadge';
import MyShopOrders from '../components/shop/MyShopOrders';
import { deliveryContents, type Deliveries } from '../lib/delivery';

interface MyItem {
  package: { id: string; name: string; category: string };
  seriesCount: number;
  quantity: number;
  price: number;
  priority?: boolean;
}

interface MyRecord {
  id: string;
  athleteName: string;
  clubName: string;
  totalPrice: number;
  status: string;
  deliveries?: Deliveries;
  createdAt: string;
  items: MyItem[];
}

// Durum etiketleri common.status.* altında
const STATUS_CLASSES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  CONFIRMED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  PAID: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  FAILED: "bg-red-500/10 text-red-400 border-red-500/30",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/30",
  DELIVERED: "bg-teal-500/10 text-teal-400 border-teal-500/30",
};

const StatusBadge = ({ status }: { status: string }) => {
  const { t } = useTranslation();
  const className = STATUS_CLASSES[status] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/30";
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${className}`}>
      {STATUS_CLASSES[status] ? t(`common.status.${status}`) : status}
    </span>
  );
};

// Parça parça teslim: "✓ Fotoğraflar teslim edildi · 26 Ekim", "⏳ Video hazırlanıyor"
const DeliveryLines = ({ record }: { record: MyRecord }) => {
  const { t } = useTranslation();
  const done = record.deliveries ?? {};
  if (Object.keys(done).length === 0) return null; // eski kayıtlar: sadece durum etiketi
  const has = deliveryContents(record.items.map((i) => ({ packageId: i.package.id, category: i.package.category })));
  const when = (iso: string) => formatDate(iso, { day: "numeric", month: "long" });
  const lines: { key: string; done: boolean; text: string }[] = [];
  for (const type of ["photo", "video", "reels"] as const) {
    const at = done[type];
    if (at) lines.push({ key: type, done: true, text: `${t(`account.profile.delivery.${type}Done`)} · ${when(at)}` });
    else if (has[type] && !done.general) lines.push({ key: type, done: false, text: t(`account.profile.delivery.${type}Pending`) });
  }
  if (done.general) lines.push({ key: "general", done: true, text: `${t("account.profile.delivery.generalDone")} · ${when(done.general)}` });
  return (
    <div className="mt-2 space-y-0.5">
      {lines.map((line) => (
        <p key={line.key} className={`text-xs ${line.done ? "text-teal-400" : "text-zinc-500"}`}>
          {line.done ? "✓" : "⏳"} {line.text}
        </p>
      ))}
    </div>
  );
};

interface RecordListProps {
  title: string;
  records: MyRecord[];
  status: LoadStatus;
  onRetry: () => void;
  // Verilirse (rezervasyonlar) ödeme öncesi kayıtlarda Düzenle/Sil gösterilir
  onDelete?: (id: string) => Promise<void>;
}

// Rezervasyon kartının alt satırı: ödeme öncesi Düzenle/Sil, sonrası bilgi notu
const ReservationActions = ({
  record,
  onDelete,
}: {
  record: MyRecord;
  onDelete: (id: string) => Promise<void>;
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { t } = useTranslation();

  if (!isCustomerEditable(record.status)) {
    return record.status === "CANCELLED" ? null : (
      <p className="text-xs text-zinc-500 mt-3">
        {t("account.profile.lockedHint")}
      </p>
    );
  }

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(record.id);
    } finally {
      setIsDeleting(false);
      setIsConfirming(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-zinc-700/50">
      {isConfirming ? (
        <>
          <span className="text-sm text-red-400 mr-1">{t("account.profile.confirmDelete")}</span>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {t("account.profile.delete")}
          </button>
          <button
            onClick={() => setIsConfirming(false)}
            disabled={isDeleting}
            className="px-3 py-1.5 rounded-lg bg-zinc-700/50 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors"
          >
            {t("account.profile.cancel")}
          </button>
        </>
      ) : (
        <>
          <LocalizedLink
            to={`/rezervasyon?duzenle=${record.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-sm font-medium transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            {t("account.profile.edit")}
          </LocalizedLink>
          <button
            onClick={() => setIsConfirming(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-700/40 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 text-sm transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t("account.profile.delete")}
          </button>
        </>
      )}
    </div>
  );
};

type LoadStatus = "loading" | "error" | "ready";

// Tek bir "/my" listesini bağımsız yükler. Rezervasyonlar ve siparişler eskiden
// tek Promise.all'daydı: sipariş isteği düşünce rezervasyonlar da kayboluyor ve
// müşteri hatayı değil "Henüz kaydınız yok" görüyordu.
const useMyRecords = (url: string) => {
  const [records, setRecords] = useState<MyRecord[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");

  // "Tekrar dene" bu sayacı artırır, effect isteği yeniden atar
  const [attempt, setAttempt] = useState(0);

  // İlk yükleme: status zaten "loading" ile başlıyor
  useEffect(() => {
    let cancelled = false;
    api
      .get(url)
      .then(({ data }) => {
        if (cancelled) return;
        setRecords(data.data || []);
        setStatus("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        console.error(`Kayıtlar yüklenemedi (${url}):`, error);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [url, attempt]);

  const reload = () => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  };

  return { records, setRecords, status, reload };
};

const RecordList = ({ title, records, status, onRetry, onDelete }: RecordListProps) => {
  const { t } = useTranslation();
  return (
    <div className="relative bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
      <div className="absolute -top-px left-6 right-6 h-px bg-linear-to-r from-transparent via-emerald-500/40 to-transparent" />
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-emerald-400" />
        {title}
      </h2>
      {status === "loading" ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
      ) : status === "error" ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-red-400">{t("account.profile.loadFail")}</p>
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            {t("account.profile.retry")}
          </button>
        </div>
      ) : records.length === 0 ? (
        <p className="text-sm text-zinc-500">{t("account.profile.empty")}</p>
      ) : (
      <div className="space-y-3">
        {records.map((r) => (
          <div
            key={r.id}
            className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div>
                <p className="text-white font-medium">{r.athleteName}</p>
                <p className="text-sm text-zinc-500">{r.clubName}</p>
              </div>
              <div className="text-right">
                <StatusBadge status={r.status} />
                <p className="text-sm text-zinc-400 mt-1">
                  ₺{formatNumber(r.totalPrice)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {r.items.map((item, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-800/80 border border-zinc-700/50 px-2 py-1 rounded-lg"
                >
                  <Package className="w-3 h-3 text-emerald-400/70" />
                  {item.package.name} × {item.quantity} ({t("account.profile.series", { count: item.seriesCount })})
                  <PriorityBadge show={item.priority} />
                </span>
              ))}
            </div>
            <DeliveryLines record={r} />
            <p className="text-xs text-zinc-600 mt-2">
              {formatDate(r.createdAt, { day: "numeric", month: "long", year: "numeric" })}
            </p>
            {onDelete && <ReservationActions record={r} onDelete={onDelete} />}
          </div>
        ))}
      </div>
      )}
    </div>
  );
};

// Profilden şifre değiştirme (aç/kapa kart)
const ChangePasswordCard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  const inputClass =
    "w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.next.length < 8) {
      toast.error(t("account.password.tooShort"));
      return;
    }
    if (form.next !== form.confirm) {
      toast.error(t("account.password.mismatch"));
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/api/auth/change-password", {
        currentPassword: form.current,
        newPassword: form.next,
      });
      toast.success(t("account.password.updated"));
      setForm({ current: "", next: "", confirm: "" });
      setIsOpen(false);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj.response?.data?.message || t("account.password.failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 rounded-2xl">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-4 p-6 text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center">
            <Lock className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{t("account.password.title")}</h2>
            <p className="text-sm text-zinc-500">{t("account.password.subtitle")}</p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <input
            type="password"
            value={form.current}
            onChange={(e) => setForm((p) => ({ ...p, current: e.target.value }))}
            className={inputClass}
            placeholder={t("account.password.current")}
            required
          />
          <input
            type="password"
            value={form.next}
            onChange={(e) => setForm((p) => ({ ...p, next: e.target.value }))}
            className={inputClass}
            placeholder={t("account.password.next")}
            required
            minLength={8}
          />
          <input
            type="password"
            value={form.confirm}
            onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
            className={inputClass}
            placeholder={t("account.password.confirm")}
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-6 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-300"
          >
            {isSubmitting ? t("account.password.submitting") : t("account.password.submit")}
          </button>
        </form>
      )}
    </div>
  );
};

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useLocalizedNavigate();
  const { t } = useTranslation();
  const reservations = useMyRecords("/api/reservations/my");
  const orders = useMyRecords("/api/orders/my");
  const loyalty = useMyLoyalty();
  const [isResending, setIsResending] = useState(false);

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      await api.post("/api/auth/resend-verification");
      toast.success(t("account.profile.resendOk"));
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj.response?.data?.message || t("account.profile.resendFail"));
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleDeleteReservation = async (id: string) => {
    try {
      await api.delete(`/api/reservations/my/${id}`);
      reservations.setRecords((prev) => prev.filter((r) => r.id !== id));
      toast.success(t("account.profile.deleted"));
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj.response?.data?.message || t("account.profile.deleteFail"));
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-28 pb-16">
      <SEO title={t("account.profile.seoTitle")} description={t("account.profile.seoDescription")} />

      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl mx-auto space-y-6"
        >
          {/* E-posta doğrulama uyarısı */}
          {user?.emailVerified === false && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-4">
              <div className="flex items-center gap-3">
                <MailWarning className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-sm text-amber-300/90">
                  {t("account.profile.unverified")}
                </p>
              </div>
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="text-sm font-medium text-amber-400 hover:text-amber-300 underline underline-offset-2 disabled:opacity-50 transition-colors"
              >
                {isResending ? t("account.profile.sending") : t("account.profile.resend")}
              </button>
            </div>
          )}

          <ProfileCard onLogout={handleLogout} />

          {loyalty && <LoyaltyCard summary={loyalty} />}

          {/* Şifre değiştirme */}
          <ChangePasswordCard />

          {/* Galeri CTA */}
          <LocalizedLink
            to="/galerim"
            className="relative flex items-center justify-between gap-4 bg-linear-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 border border-emerald-500/30 hover:border-emerald-500/50 rounded-2xl p-6 transition-all duration-300 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <Images className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{t("account.profile.myPhotos")}</h2>
                <p className="text-sm text-zinc-400">
                  {t("account.profile.myPhotosText")}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
          </LocalizedLink>

          <div>
          <RecordList
            title={t("account.profile.reservations")}
            records={reservations.records}
            status={reservations.status}
            onRetry={reservations.reload}
            onDelete={handleDeleteReservation}
          />
            <LocalizedLink
              to="/rezervasyon"
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {t("account.profile.newForOther")}
            </LocalizedLink>
          </div>
          <RecordList
            title={t("account.profile.orders")}
            records={orders.records}
            status={orders.status}
            onRetry={orders.reload}
          />
          <MyShopOrders />
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
