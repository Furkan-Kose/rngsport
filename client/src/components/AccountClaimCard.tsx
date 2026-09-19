import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Lock, Mail, Image as ImageIcon, Loader2, ArrowRight } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

/** Backend'in döndürdüğü hesap durumu (bkz. backend/src/utils/customerAccount.js) */
export type AccountStatus = "claimable" | "linked" | "expired" | "none";

export interface AccountInfo {
  status: AccountStatus;
  email: string;
}

interface Props {
  account: AccountInfo;
  /** Kaydın cuid'i — şifre belirleme yetkisini bu kanıtlıyor */
  orderId?: string;
  reservationId?: string;
}

/**
 * Sipariş/rezervasyon başarı ekranındaki "hesabını tamamla" kartı.
 *
 * Misafir kayıt yaptığında backend arka planda şifresiz bir müşteri hesabı açıyor;
 * fotoğraflar oraya yükleneceği için müşterinin o hesaba girebilmesi gerekiyor.
 * Kart şifreyi burada belirletip anında giriş yapar — mail yedek yol olarak kalır.
 */
const AccountClaimCard = ({ account, orderId, reservationId }: Props) => {
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  // 409: bu e-postaya ait şifreli bir hesap zaten varmış (kart açıldıktan sonra
  // başka bir sekmede sahiplenilmiş olabilir) — artık şifre sorulmaz.
  const [alreadyExists, setAlreadyExists] = useState(false);

  const wrapper =
    "mt-8 text-left bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 relative";
  const topLine =
    "absolute -top-px left-6 right-6 h-px bg-linear-to-r from-transparent via-emerald-500/40 to-transparent";

  if (account.status === "none") return null;

  // Şifreli hesabı olan e-postayla sipariş verildi: kayıt hesaba bağlandı ama
  // şifre SORULMAZ — yoksa başkasının e-postasını yazan kişi hesabı ele geçirirdi.
  if (account.status === "linked" || alreadyExists) {
    return (
      <div className={wrapper}>
        <div className={topLine} />
        <p className="text-sm text-zinc-400">
          Bu kayıt <span className="text-emerald-400">{account.email}</span> hesabınıza
          tanımlandı. Fotoğraflarınız hazır olduğunda galerinizde görünecek.
        </p>
        <Link
          to="/giris?redirect=/galerim"
          className="mt-4 inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium text-sm transition-colors"
        >
          Giriş yap ve galerine git
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // 24 saatlik sahiplenme penceresi dolmuş — normal şifre sıfırlama akışı devrede.
  if (account.status === "expired") {
    return (
      <div className={wrapper}>
        <div className={topLine} />
        <p className="text-sm text-zinc-400">
          <span className="text-emerald-400">{account.email}</span> için hesabınız hazır.
          Şifrenizi belirlemek için şifremi unuttum adımını kullanın.
        </p>
        <Link
          to="/sifremi-unuttum"
          className="mt-4 inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium text-sm transition-colors"
        >
          Şifremi belirle
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (dismissed) {
    return (
      <div className={wrapper}>
        <div className={topLine} />
        <p className="text-sm text-zinc-400">
          Sorun değil — <span className="text-emerald-400">{account.email}</span> adresine
          gönderdiğimiz e-postadaki bağlantıdan şifrenizi istediğiniz zaman
          belirleyebilirsiniz.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalı");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/api/auth/claim-account", { orderId, reservationId, password });
      await refresh();
      navigate("/galerim");
    } catch (err: unknown) {
      const res = (err as { response?: { status?: number; data?: { message?: string } } })
        .response;
      if (res?.status === 409) {
        setAlreadyExists(true);
        return;
      }
      setError(res?.data?.message || "Bir hata oluştu, lütfen tekrar deneyin");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={wrapper}
    >
      <div className={topLine} />

      <div className="flex items-start gap-3 mb-5">
        <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <ImageIcon className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Hesabını tamamla</h3>
          <p className="text-sm text-zinc-400 mt-1">
            Fotoğraflarınız bu hesaba yüklenecek. Bir şifre belirleyin, hemen girelim.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
            <Mail className="w-4 h-4" />
            E-posta
          </label>
          <input
            type="email"
            value={account.email}
            readOnly
            disabled
            className="w-full px-4 py-3 bg-zinc-800/30 border border-zinc-800 rounded-xl text-zinc-400 cursor-not-allowed"
          />
        </div>

        <div>
          <label
            htmlFor="claim-password"
            className="flex items-center gap-2 text-sm text-zinc-400 mb-2"
          >
            <Lock className="w-4 h-4" />
            Şifre <span className="text-red-400">*</span>
          </label>
          <input
            type="password"
            id="claim-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
            placeholder="En az 8 karakter"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 min-w-40 py-3 px-6 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Oluşturuluyor...
              </>
            ) : (
              "Hesabımı Oluştur"
            )}
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Şimdi değil
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default AccountClaimCard;
