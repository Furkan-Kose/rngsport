import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import LocalizedLink from "../components/LocalizedLink";
import { useLocalizedNavigate } from "../lib/localePath";
import { formatDate } from "../lib/format";
import {
  Images,
  ChevronRight,
  ChevronDown,
  Check,
  Hourglass,
  Pencil,
  Trash2,
  LogOut,
  Plus,
  MailWarning,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import SEO from "../components/SEO";
import ProfileCard from "../components/ProfileCard";
import LoyaltyCard from "../components/LoyaltyCard";
import Modal from "../components/ui/Modal";
import { Alert, Button, Card, Field, Input, PageHeader, Pill, Skeleton } from "../components/ui/kit";
import { useMyLoyalty } from "../hooks/useMyLoyalty";
import { isCustomerEditable } from "../lib/myReservations";
import PriorityBadge from "../components/PriorityBadge";
import MyShopOrders from "../components/shop/MyShopOrders";
import { deliveryContents, type Deliveries } from "../lib/delivery";
import { formatTL } from "../lib/loyalty";
import {
  buttonClass,
  cardClass,
  cardTone,
  containerClass,
  cx,
  innerRowClass,
  pageClass,
  widthGrid,
  type Tone,
} from "../lib/siteUi";

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
  tournament?: { id: string; name: string; date?: string } | null; // hangi yarışma için
  items: MyItem[];
}

/** Rezervasyon (yarışma günü ödeme) ve sipariş (online ödeme) aynı durum adlarını
    kullanır ama müşteri için anlamları farklıdır; etiket ve açıklama türe göre seçilir. */
type RecordKind = "reservation" | "order";

const STATUS_TONES: Record<string, Tone> = {
  PENDING: "warning",
  CONFIRMED: "info",
  PAID: "success",
  DELIVERED: "success",
  FAILED: "danger",
  CANCELLED: "danger",
};

const StatusBadge = ({ status, kind }: { status: string; kind: RecordKind }) => {
  const { t } = useTranslation();
  if (!STATUS_TONES[status]) return <Pill>{status}</Pill>;
  // Türe özel etiket varsa o (ör. rezervasyonda PENDING = "Stantta ödenecek")
  const label = t(`account.profile.statusLabel.${kind}.${status}`, {
    defaultValue: t(`common.status.${status}`),
  });
  return <Pill tone={STATUS_TONES[status]}>{label}</Pill>;
};

// Parça parça teslim: "Fotoğraflar teslim edildi · 26 Ekim", "Video hazırlanıyor"
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
    <ul className="mt-3 space-y-1">
      {lines.map((line) => (
        <li key={line.key} className={cx("flex items-center gap-2 text-sm", line.done ? "text-emerald-400" : "text-zinc-400")}>
          {line.done ? <Check className="w-4 h-4" aria-hidden /> : <Hourglass className="w-4 h-4" aria-hidden />}
          {line.text}
        </li>
      ))}
    </ul>
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

// Kayıtları yarışmaya göre gruplar. Liste en yeni kayıt önce geldiği için gruplar da en yeni
// yarışma önce sıralanır.
const groupByTournament = (records: MyRecord[]) => {
  const groups = new Map<string, { key: string; name: string; records: MyRecord[] }>();
  for (const r of records) {
    const key = r.tournament?.id ?? "";
    if (!groups.has(key)) groups.set(key, { key, name: r.tournament?.name ?? "", records: [] });
    groups.get(key)!.records.push(r);
  }
  return [...groups.values()];
};

interface RecordListProps {
  title: string;
  kind: RecordKind;
  records: MyRecord[];
  status: LoadStatus;
  onRetry: () => void;
  // Verilirse (rezervasyonlar) ödeme öncesi kayıtlarda Düzenle/Sil gösterilir
  onDelete?: (id: string) => Promise<void>;
  /** Başlığın sağındaki işlem (ör. yeni rezervasyon) */
  action?: React.ReactNode;
  /** Kayıt yoksa bölümü hiç gösterme (siparişler) */
  hideWhenEmpty?: boolean;
}

const RecordList = ({ title, kind, records, status, onRetry, onDelete, action, hideWhenEmpty }: RecordListProps) => {
  const { t } = useTranslation();
  const [deleting, setDeleting] = useState<MyRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (hideWhenEmpty && status === "ready" && records.length === 0) return null;

  const confirmDelete = async () => {
    if (!deleting || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(deleting.id);
    } finally {
      setIsDeleting(false);
      setDeleting(null);
    }
  };

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {action}
      </div>

      {status === "loading" ? (
        <Skeleton className="h-32 rounded-2xl" />
      ) : status === "error" ? (
        <Alert tone="danger">
          <p>{t("account.profile.loadFail")}</p>
          <button type="button" onClick={onRetry} className="underline font-medium">
            {t("account.profile.retry")}
          </button>
        </Alert>
      ) : records.length === 0 ? (
        <p className={cx(cardClass, "p-5 text-zinc-400")}>{t("account.profile.empty")}</p>
      ) : (
        <div className="space-y-5">
          {groupByTournament(records).map((group) => (
            <div key={group.key}>
              {group.name && <h3 className="text-sm font-semibold text-zinc-300 mb-2">{group.name}</h3>}
              <ul className="space-y-3">
                {group.records.map((r) => {
                  const help = t(`account.profile.statusHelp.${kind}.${r.status}`, { defaultValue: "" });
                  const editable = !!onDelete && isCustomerEditable(r.status);
                  return (
                    <li key={r.id} className={cx(cardClass, "p-5")}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-white">{r.athleteName}</p>
                          <p className="text-sm text-zinc-400">{r.clubName}</p>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={r.status} kind={kind} />
                          <p className="mt-1.5 font-semibold text-zinc-100">{formatTL(r.totalPrice)}</p>
                        </div>
                      </div>

                      {help && <p className="mt-2 text-sm text-zinc-400">{help}</p>}

                      <ul className={cx(innerRowClass, "mt-3 px-4 py-3 space-y-1 text-sm text-zinc-200")}>
                        {r.items.map((item, i) => (
                          <li key={i}>
                            {item.package.name} × {item.quantity}{" "}
                            <span className="text-zinc-400">
                              ({t("account.profile.series", { count: item.seriesCount })})
                            </span>
                            <PriorityBadge show={item.priority} />
                          </li>
                        ))}
                      </ul>

                      <DeliveryLines record={r} />

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-zinc-400">
                          {formatDate(r.createdAt, { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                        {editable && (
                          <div className="flex gap-2">
                            <LocalizedLink
                              to={`/rezervasyon?duzenle=${r.id}`}
                              className={buttonClass("secondary", "sm")}
                            >
                              <Pencil className="w-4 h-4" aria-hidden />
                              {t("account.profile.edit")}
                            </LocalizedLink>
                            <Button variant="danger" size="sm" icon={Trash2} onClick={() => setDeleting(r)}>
                              {t("account.profile.delete")}
                            </Button>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!deleting}
        onClose={() => !isDeleting && setDeleting(null)}
        title={t("account.profile.confirmDelete")}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)} disabled={isDeleting}>
              {t("account.profile.cancel")}
            </Button>
            <Button variant="danger" loading={isDeleting} onClick={confirmDelete}>
              {t("account.profile.delete")}
            </Button>
          </>
        }
      >
        <p className="text-zinc-300">
          {t("account.profile.confirmDeleteText", { name: deleting?.athleteName ?? "" })}
        </p>
      </Modal>
    </section>
  );
};

// Profilden şifre değiştirme (aç/kapa kart)
const ChangePasswordCard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<{ next?: string; confirm?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const found = {
      next: form.next.length < 8 ? t("account.password.tooShort") : undefined,
      confirm: form.next !== form.confirm ? t("account.password.mismatch") : undefined,
    };
    setErrors(found);
    if (found.next || found.confirm) return;

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
    <Card padding="none">
      <h2>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="change-password-panel"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left rounded-2xl"
        >
          <span>
            <span className="block text-lg font-semibold text-white">{t("account.password.title")}</span>
            <span className="block text-sm font-normal text-zinc-400">{t("account.password.subtitle")}</span>
          </span>
          <ChevronDown
            aria-hidden
            className={cx("w-5 h-5 text-zinc-400 transition-transform", isOpen && "rotate-180")}
          />
        </button>
      </h2>

      {isOpen && (
        <form
          id="change-password-panel"
          onSubmit={handleSubmit}
          noValidate
          className="px-5 pb-5 sm:px-6 sm:pb-6 space-y-4"
        >
          <Field label={t("account.password.current")} htmlFor="pw-current" required>
            <Input
              type="password"
              id="pw-current"
              value={form.current}
              onChange={(e) => setForm((p) => ({ ...p, current: e.target.value }))}
              autoComplete="current-password"
              required
            />
          </Field>
          <Field
            label={t("account.password.next")}
            htmlFor="pw-next"
            required
            error={errors.next}
            hint={t("auth.passwordPlaceholder")}
          >
            <Input
              type="password"
              id="pw-next"
              value={form.next}
              onChange={(e) => setForm((p) => ({ ...p, next: e.target.value }))}
              autoComplete="new-password"
              invalid={!!errors.next}
            />
          </Field>
          <Field label={t("account.password.confirm")} htmlFor="pw-confirm" required error={errors.confirm}>
            <Input
              type="password"
              id="pw-confirm"
              value={form.confirm}
              onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
              autoComplete="new-password"
              invalid={!!errors.confirm}
            />
          </Field>
          <Button type="submit" loading={isSubmitting} className="w-full">
            {isSubmitting ? t("account.password.submitting") : t("account.password.submit")}
          </Button>
        </form>
      )}
    </Card>
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
    <div className={pageClass}>
      <SEO noindex title={t("account.profile.seoTitle")} description={t("account.profile.seoDescription")} />

      <div className={containerClass}>
        <div className={widthGrid}>
          <PageHeader
            title={user?.name || t("account.card.fallbackTitle")}
            subtitle={user?.email}
            actions={
              <Button variant="secondary" size="sm" icon={LogOut} onClick={handleLogout}>
                {t("account.card.logout")}
              </Button>
            }
          />

          {/* E-posta doğrulama uyarısı */}
          {user?.emailVerified === false && (
            <Alert tone="warning" icon={MailWarning} className="mb-8">
              <p>{t("account.profile.unverified")}</p>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResending}
                className="font-medium underline underline-offset-2 disabled:opacity-50"
              >
                {isResending ? t("account.profile.sending") : t("account.profile.resend")}
              </button>
            </Alert>
          )}

          {/* Geniş ekranda iki sütun: solda fotoğraflar ve kayıtlar ("ne aldım, ne durumda"),
              sağda hesaba ait seyrek bakılan kısım. Dar ekranda tek sütun, aynı sırayla. */}
          <div className="grid lg:grid-cols-5 gap-8 items-start">
            <div className="lg:col-span-3 space-y-8 min-w-0">
              {/* En sık gidilen yer: fotoğraflar */}
              <LocalizedLink
                to="/galerim"
                className={cx(
                  cardTone("soft"),
                  "flex items-center justify-between gap-4 p-5 sm:p-6 hover:border-emerald-400 transition-colors",
                )}
              >
                <span className="flex items-center gap-4">
                  <Images className="w-7 h-7 text-emerald-400 shrink-0" aria-hidden />
                  <span>
                    <span className="block text-lg font-semibold text-white">{t("account.profile.myPhotos")}</span>
                    <span className="block text-sm text-zinc-400">{t("account.profile.myPhotosText")}</span>
                  </span>
                </span>
                <ChevronRight className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden />
              </LocalizedLink>

              <RecordList
                title={t("account.profile.reservations")}
                kind="reservation"
                records={reservations.records}
                status={reservations.status}
                onRetry={reservations.reload}
                onDelete={handleDeleteReservation}
                action={
                  <LocalizedLink to="/rezervasyon" className={buttonClass("secondary", "sm")}>
                    <Plus className="w-4 h-4" aria-hidden />
                    {t("account.profile.newReservation")}
                  </LocalizedLink>
                }
              />

              <RecordList
                title={t("account.profile.orders")}
                kind="order"
                records={orders.records}
                status={orders.status}
                onRetry={orders.reload}
                hideWhenEmpty
              />

              <MyShopOrders />
            </div>

            {/* Sabit (sticky) değil: üç kart birlikte ekrandan uzun, sabitlenince alttaki kart görünmüyor */}
            <aside className="lg:col-span-2 space-y-4 min-w-0">
              {loyalty && <LoyaltyCard summary={loyalty} />}
              <ProfileCard />
              <ChangePasswordCard />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
