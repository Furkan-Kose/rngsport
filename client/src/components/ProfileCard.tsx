import { useState, type FormEvent } from "react";
import {
  User,
  Mail,
  Phone,
  Building2,
  CalendarDays,
  Pencil,
  LogOut,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

const inputClass =
  "w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors";
const labelClass = "flex items-center gap-2 text-sm text-zinc-400 mb-2";

const InfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value?: string | null;
}) => (
  <div className="flex items-center gap-3 text-zinc-300">
    <Icon className="w-4 h-4 text-emerald-400/70 shrink-0" />
    <span className="text-sm text-zinc-500 w-24 shrink-0">{label}</span>
    <span className="text-sm">{value || "—"}</span>
  </div>
);

/**
 * Profil kartı — görüntüleme ve düzenleme.
 *
 * Sporcu bilgileri rezervasyon formunu ön-doldurduğu için kullanıcının bunları
 * kendisi düzeltebilmesi gerekiyor. E-posta buradan değiştirilemez: adres
 * değişimi doğrulama akışı gerektirir (PATCH /api/auth/me de kabul etmiyor).
 */
const ProfileCard = ({ onLogout }: { onLogout: () => void }) => {
  const { user, refresh } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    clubName: "",
    birthYear: "",
    phone: "",
  });

  const openEdit = () => {
    setForm({
      name: user?.name ?? "",
      clubName: user?.clubName ?? "",
      birthYear: user?.birthYear ?? "",
      phone: user?.phone ?? "",
    });
    setIsEditing(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.patch("/api/auth/me", form);
      await refresh();
      toast.success("Bilgileriniz güncellendi");
      setIsEditing(false);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj.response?.data?.message || "Güncellenemedi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
            <p className="text-zinc-500 text-sm">Sporcu ve iletişim bilgileriniz</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              onClick={openEdit}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800/60 hover:bg-emerald-500/10 border border-zinc-700/50 hover:border-emerald-500/50 text-zinc-300 hover:text-emerald-400 text-sm transition-all duration-300"
            >
              <Pencil className="w-4 h-4" />
              <span className="hidden sm:inline">Düzenle</span>
            </button>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800/60 hover:bg-red-500/10 border border-zinc-700/50 hover:border-red-500/50 text-zinc-300 hover:text-red-400 text-sm transition-all duration-300"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Çıkış Yap</span>
          </button>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="p-name" className={labelClass}>
              <User className="w-4 h-4" />
              Sporcu Adı Soyadı
            </label>
            <input
              type="text"
              id="p-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className={inputClass}
              required
              minLength={2}
            />
            <p className="text-xs text-zinc-600 mt-1.5">
              Çekim listesi eşleşmesi bu isimle yapılır; yarışma kaydındaki yazımla aynı
              olmasına dikkat edin.
            </p>
          </div>

          <div>
            <label htmlFor="p-club" className={labelClass}>
              <Building2 className="w-4 h-4" />
              Kulüp
            </label>
            <input
              type="text"
              id="p-club"
              value={form.clubName}
              onChange={(e) => setForm((p) => ({ ...p, clubName: e.target.value }))}
              className={inputClass}
              placeholder="Kulüp adı"
            />
          </div>

          <div>
            <label htmlFor="p-birth" className={labelClass}>
              <CalendarDays className="w-4 h-4" />
              Doğum Yılı
            </label>
            <input
              type="text"
              id="p-birth"
              value={form.birthYear}
              onChange={(e) => setForm((p) => ({ ...p, birthYear: e.target.value }))}
              className={inputClass}
              placeholder="2011"
            />
          </div>

          <div>
            <label htmlFor="p-phone" className={labelClass}>
              <Phone className="w-4 h-4" />
              Telefon
            </label>
            <input
              type="tel"
              id="p-phone"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              className={inputClass}
              placeholder="05xx xxx xx xx"
            />
          </div>

          <div>
            <label className={labelClass}>
              <Mail className="w-4 h-4" />
              E-posta
            </label>
            <input
              type="email"
              value={user?.email ?? ""}
              readOnly
              disabled
              className="w-full px-4 py-3 bg-zinc-800/30 border border-zinc-800 rounded-xl text-zinc-500 cursor-not-allowed"
            />
            <p className="text-xs text-zinc-600 mt-1.5">
              E-posta adresi buradan değiştirilemez.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 min-w-40 py-3 px-6 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-300 text-sm font-medium transition-colors disabled:opacity-50"
            >
              Vazgeç
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          <InfoRow icon={User} label="Sporcu" value={user?.name} />
          <InfoRow icon={Building2} label="Kulüp" value={user?.clubName} />
          <InfoRow icon={CalendarDays} label="Doğum Yılı" value={user?.birthYear} />
          <InfoRow icon={Mail} label="E-posta" value={user?.email} />
          <InfoRow icon={Phone} label="Telefon" value={user?.phone} />
        </div>
      )}
    </div>
  );
};

export default ProfileCard;
