import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  LogOut,
  Images,
  Calendar,
  ChevronRight,
  ChevronDown,
  Package,
  Lock,
  MailWarning,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import SEO from "../components/SEO";

interface MyItem {
  package: { id: string; name: string; category: string };
  seriesCount: number;
  quantity: number;
  price: number;
}

interface MyRecord {
  id: string;
  athleteName: string;
  clubName: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  items: MyItem[];
}

const RESERVATION_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Beklemede", className: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  CONFIRMED: { label: "Onaylandı", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  PAID: { label: "Ödendi", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  FAILED: { label: "Başarısız", className: "bg-red-500/10 text-red-400 border-red-500/30" },
  CANCELLED: { label: "İptal", className: "bg-red-500/10 text-red-400 border-red-500/30" },
  DELIVERED: { label: "Teslim Edildi", className: "bg-teal-500/10 text-teal-400 border-teal-500/30" },
};

const StatusBadge = ({ status }: { status: string }) => {
  const info = RESERVATION_STATUS_LABELS[status] || {
    label: status,
    className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${info.className}`}>
      {info.label}
    </span>
  );
};

const RecordList = ({ title, records }: { title: string; records: MyRecord[] }) => {
  if (records.length === 0) return null;
  return (
    <div className="relative bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
      <div className="absolute -top-px left-6 right-6 h-px bg-linear-to-r from-transparent via-emerald-500/40 to-transparent" />
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-emerald-400" />
        {title}
      </h2>
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
                  ₺{r.totalPrice.toLocaleString("tr-TR")}
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
                  {item.package.name} × {item.quantity} ({item.seriesCount} seri)
                </span>
              ))}
            </div>
            <p className="text-xs text-zinc-600 mt-2">
              {new Date(r.createdAt).toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Profilden şifre değiştirme (aç/kapa kart)
const ChangePasswordCard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass =
    "w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.next.length < 8) {
      toast.error("Yeni şifre en az 8 karakter olmalı");
      return;
    }
    if (form.next !== form.confirm) {
      toast.error("Yeni şifreler eşleşmiyor");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/api/auth/change-password", {
        currentPassword: form.current,
        newPassword: form.next,
      });
      toast.success("Şifreniz güncellendi");
      setForm({ current: "", next: "", confirm: "" });
      setIsOpen(false);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj.response?.data?.message || "Şifre güncellenemedi");
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
            <h2 className="text-lg font-semibold text-white">Şifre Değiştir</h2>
            <p className="text-sm text-zinc-500">Hesap şifrenizi güncelleyin</p>
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
            placeholder="Mevcut şifreniz"
            required
          />
          <input
            type="password"
            value={form.next}
            onChange={(e) => setForm((p) => ({ ...p, next: e.target.value }))}
            className={inputClass}
            placeholder="Yeni şifre (en az 8 karakter)"
            required
            minLength={8}
          />
          <input
            type="password"
            value={form.confirm}
            onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
            className={inputClass}
            placeholder="Yeni şifre tekrar"
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-6 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-300"
          >
            {isSubmitting ? "Güncelleniyor..." : "Şifreyi Güncelle"}
          </button>
        </form>
      )}
    </div>
  );
};

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<MyRecord[]>([]);
  const [orders, setOrders] = useState<MyRecord[]>([]);
  const [isResending, setIsResending] = useState(false);

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      await api.post("/api/auth/resend-verification");
      toast.success("Doğrulama maili gönderildi, gelen kutunuzu kontrol edin");
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj.response?.data?.message || "Mail gönderilemedi");
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const [resRes, ordRes] = await Promise.all([
          api.get("/api/reservations/my"),
          api.get("/api/orders/my"),
        ]);
        setReservations(resRes.data.data || []);
        setOrders(ordRes.data.data || []);
      } catch (error) {
        console.error("Kayıtlar yüklenemedi:", error);
      }
    };
    fetchRecords();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-28 pb-16">
      <SEO title="Hesabım" description="RNG Sport hesap bilgileriniz ve kayıtlarınız." />

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
                  E-posta adresiniz henüz doğrulanmadı.
                </p>
              </div>
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="text-sm font-medium text-amber-400 hover:text-amber-300 underline underline-offset-2 disabled:opacity-50 transition-colors"
              >
                {isResending ? "Gönderiliyor..." : "Doğrulama mailini tekrar gönder"}
              </button>
            </div>
          )}

          {/* Profil kartı */}
          <div className="relative bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 sm:p-8">
            <div className="absolute -top-px left-6 right-6 h-px bg-linear-to-r from-transparent via-emerald-500/40 to-transparent" />

            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <User className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gradient-brand">
                    {user?.name || "Hesabım"}
                  </h1>
                  <p className="text-zinc-500 text-sm">Hesap bilgileriniz</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800/60 hover:bg-red-500/10 border border-zinc-700/50 hover:border-red-500/50 text-zinc-300 hover:text-red-400 text-sm transition-all duration-300"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Çıkış Yap</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-zinc-300">
                <Mail className="w-4 h-4 text-emerald-400/70 shrink-0" />
                <span className="text-sm">{user?.email}</span>
              </div>
              {user?.phone && (
                <div className="flex items-center gap-3 text-zinc-300">
                  <Phone className="w-4 h-4 text-emerald-400/70 shrink-0" />
                  <span className="text-sm">{user.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Şifre değiştirme */}
          <ChangePasswordCard />

          {/* Galeri CTA */}
          <Link
            to="/galerim"
            className="relative flex items-center justify-between gap-4 bg-linear-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 border border-emerald-500/30 hover:border-emerald-500/50 rounded-2xl p-6 transition-all duration-300 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <Images className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Fotoğraflarım</h2>
                <p className="text-sm text-zinc-400">
                  Çekim fotoğraflarınızı görüntüleyin ve indirin
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          <RecordList title="Rezervasyonlarım" records={reservations} />
          <RecordList title="Siparişlerim" records={orders} />
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
