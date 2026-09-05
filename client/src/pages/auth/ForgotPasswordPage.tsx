import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { KeyRound, Mail, MailCheck } from "lucide-react";
import api from "../../lib/api";
import SEO from "../../components/SEO";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await api.post("/api/auth/forgot-password", { email: email.trim() });
      setIsSent(true);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(errorObj.response?.data?.message || "Bir hata oluştu, lütfen tekrar deneyin");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-28 pb-16">
      <SEO title="Şifremi Unuttum" description="RNG Sport hesabınızın şifresini sıfırlayın." />

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
            <h1 className="text-3xl font-bold text-gradient-brand">Şifremi Unuttum</h1>
            <p className="text-zinc-500 text-sm mt-2">
              E-posta adresinize sıfırlama bağlantısı gönderelim
            </p>
          </div>

          <div className="relative bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 sm:p-8">
            <div className="absolute -top-px left-6 right-6 h-px bg-linear-to-r from-transparent via-emerald-500/40 to-transparent" />

            {isSent ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-4">
                  <MailCheck className="w-7 h-7 text-emerald-400" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">Bağlantı Gönderildi</h2>
                <p className="text-sm text-zinc-400 mb-6">
                  Bu e-posta kayıtlıysa şifre sıfırlama bağlantısı gönderildi.
                  Gelen kutunuzu (ve spam klasörünü) kontrol edin.
                </p>
                <Link
                  to="/giris"
                  className="text-emerald-400 hover:text-emerald-300 font-medium text-sm transition-colors"
                >
                  Giriş sayfasına dön
                </Link>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm">
                      {error}
                    </div>
                  )}

                  <div>
                    <label htmlFor="email" className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                      <Mail className="w-4 h-4" />
                      E-posta <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="ornek@eposta.com"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 px-6 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-300"
                  >
                    {isSubmitting ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
                  </button>
                </form>

                <p className="text-center text-sm text-zinc-500 mt-6">
                  Şifrenizi hatırladınız mı?{" "}
                  <Link to="/giris" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                    Giriş Yapın
                  </Link>
                </p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
