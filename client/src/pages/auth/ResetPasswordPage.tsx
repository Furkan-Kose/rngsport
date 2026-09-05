import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import { Lock, KeyRound, CheckCircle2 } from "lucide-react";
import api from "../../lib/api";
import SEO from "../../components/SEO";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalı");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Şifreler eşleşmiyor");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/api/auth/reset-password", { token, password });
      setIsDone(true);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(errorObj.response?.data?.message || "Bir hata oluştu, lütfen tekrar deneyin");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors";

  return (
    <div className="min-h-screen bg-zinc-950 pt-28 pb-16">
      <SEO title="Şifre Sıfırla" description="RNG Sport hesabınız için yeni şifre belirleyin." />

      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md mx-auto"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mb-4">
              <KeyRound className="w-7 h-7 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-gradient-brand">Yeni Şifre Belirle</h1>
          </div>

          <div className="relative bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 sm:p-8">
            <div className="absolute -top-px left-6 right-6 h-px bg-linear-to-r from-transparent via-emerald-500/40 to-transparent" />

            {isDone ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-4">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">Şifreniz Güncellendi</h2>
                <p className="text-sm text-zinc-400 mb-6">
                  Yeni şifrenizle giriş yapabilirsiniz.
                </p>
                <Link
                  to="/giris"
                  className="inline-block py-3 px-8 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold transition-all duration-300"
                >
                  Giriş Yap
                </Link>
              </div>
            ) : !token ? (
              <div className="text-center py-4">
                <p className="text-sm text-zinc-400 mb-6">
                  Sıfırlama bağlantısı geçersiz. Lütfen e-postanızdaki bağlantıyı kullanın
                  veya yeni bir bağlantı isteyin.
                </p>
                <Link
                  to="/sifremi-unuttum"
                  className="text-emerald-400 hover:text-emerald-300 font-medium text-sm transition-colors"
                >
                  Yeni bağlantı iste
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm">
                    {error}{" "}
                    {error.includes("geçersiz") && (
                      <Link to="/sifremi-unuttum" className="underline text-red-300">
                        Yeni bağlantı iste
                      </Link>
                    )}
                  </div>
                )}

                <div>
                  <label htmlFor="password" className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                    <Lock className="w-4 h-4" />
                    Yeni Şifre <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    placeholder="En az 8 karakter"
                    required
                    minLength={8}
                  />
                </div>

                <div>
                  <label htmlFor="passwordConfirm" className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                    <Lock className="w-4 h-4" />
                    Yeni Şifre Tekrar <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    id="passwordConfirm"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className={inputClass}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-300"
                >
                  {isSubmitting ? "Güncelleniyor..." : "Şifreyi Güncelle"}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
