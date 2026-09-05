import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import { UserPlus, Mail, Lock, Phone, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import SEO from "../../components/SEO";

const RegisterPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    passwordConfirm: "",
  });
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, isAuthenticated, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/profil";

  // Zaten girişliyse yönlendir
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(isAdmin ? "/admin" : redirect, { replace: true });
    }
  }, [isLoading, isAuthenticated, isAdmin, redirect, navigate]);

  const updateForm = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Şifre en az 8 karakter olmalı");
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setError("Şifreler eşleşmiyor");
      return;
    }

    setIsSubmitting(true);

    const result = await register({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      password: form.password,
    });

    if (result.success) {
      navigate(redirect, { replace: true });
    } else {
      setError(result.message || "Kayıt başarısız");
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors";
  const labelClass = "flex items-center gap-2 text-sm text-zinc-400 mb-2";

  return (
    <div className="min-h-screen bg-zinc-950 pt-28 pb-16">
      <SEO
        title="Kayıt Ol"
        description="RNG Sport hesabı oluşturun; çekim fotoğraflarınız hesabınıza tanımlansın."
        keywords="rng sport kayıt, hesap oluştur"
      />

      {/* Dekoratif arka plan */}
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
              <UserPlus className="w-7 h-7 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-gradient-brand">Kayıt Ol</h1>
            <p className="text-zinc-500 text-sm mt-2">
              Çekim fotoğraflarınız hesabınıza tanımlanır
            </p>
          </div>

          <div className="relative bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 sm:p-8">
            <div className="absolute -top-px left-6 right-6 h-px bg-linear-to-r from-transparent via-emerald-500/40 to-transparent" />

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className={labelClass}>
                  <User className="w-4 h-4" />
                  Ad Soyad <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  className={inputClass}
                  placeholder="Adınız Soyadınız"
                  required
                  minLength={2}
                />
              </div>

              <div>
                <label htmlFor="email" className={labelClass}>
                  <Mail className="w-4 h-4" />
                  E-posta <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  className={inputClass}
                  placeholder="ornek@eposta.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className={labelClass}>
                  <Phone className="w-4 h-4" />
                  Telefon
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={form.phone}
                  onChange={(e) => updateForm("phone", e.target.value)}
                  className={inputClass}
                  placeholder="05xx xxx xx xx"
                />
              </div>

              <div>
                <label htmlFor="password" className={labelClass}>
                  <Lock className="w-4 h-4" />
                  Şifre <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  value={form.password}
                  onChange={(e) => updateForm("password", e.target.value)}
                  className={inputClass}
                  placeholder="En az 8 karakter"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label htmlFor="passwordConfirm" className={labelClass}>
                  <Lock className="w-4 h-4" />
                  Şifre Tekrar <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  id="passwordConfirm"
                  value={form.passwordConfirm}
                  onChange={(e) => updateForm("passwordConfirm", e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* KVKK Onay */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={kvkkAccepted}
                  onChange={(e) => setKvkkAccepted(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                  <Link
                    to="/kvkk-aydinlatma-metni"
                    target="_blank"
                    className="text-emerald-400 hover:text-emerald-300 underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK)
                    kapsamında hazırlanan [Aydınlatma Metni]
                  </Link>
                  'ni okudum ve kabul ediyorum.{" "}
                  <span className="text-red-400">*</span>
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting || !kvkkAccepted}
                className="w-full py-4 px-6 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Kayıt yapılıyor..." : "Kayıt Ol"}
              </button>
            </form>

            <p className="text-center text-sm text-zinc-500 mt-6">
              Zaten hesabınız var mı?{" "}
              <Link
                to={`/giris${redirect !== "/profil" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
                className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                Giriş Yapın
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
