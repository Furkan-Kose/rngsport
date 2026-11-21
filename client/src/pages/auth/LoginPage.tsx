import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import LocalizedLink from "../../components/LocalizedLink";
import { useLocalizedNavigate } from "../../lib/localePath";
import { useAuth } from "../../context/AuthContext";
import SEO from "../../components/SEO";
import AuthShell from "../../components/ui/AuthShell";
import { Alert, Button, Field, Input } from "../../components/ui/kit";

const linkClass = "text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-4";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, isAdmin, isLoading } = useAuth();
  const navigate = useLocalizedNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/profil";

  // Zaten girişliyse yönlendir
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(isAdmin ? "/admin" : redirect, { replace: true });
    }
  }, [isLoading, isAuthenticated, isAdmin, redirect, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await login(email.trim(), password);

    if (result.success) {
      navigate(redirect, { replace: true });
    } else {
      setError(result.message || t("auth.errors.loginFailed"));
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={t("auth.login.title")}
      subtitle={t("auth.login.subtitle")}
      footer={
        <>
          {t("auth.login.noAccount")}{" "}
          <LocalizedLink
            to={`/kayit${redirect !== "/profil" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
            className={linkClass}
          >
            {t("auth.login.register")}
          </LocalizedLink>
        </>
      }
    >
      <SEO
        noindex
        title={t("auth.login.seoTitle")}
        description={t("auth.login.seoDescription")}
        keywords={t("auth.login.seoKeywords")}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert tone="danger">{error}</Alert>}

        <Field label={t("auth.email")} htmlFor="email" required>
          <Input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth.emailPlaceholder")}
            autoComplete="username"
            inputMode="email"
            required
          />
        </Field>

        <Field label={t("auth.password")} htmlFor="password" required>
          <Input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </Field>

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          {isSubmitting ? t("auth.login.submitting") : t("auth.login.submit")}
        </Button>

        <p className="text-center">
          <LocalizedLink to="/sifremi-unuttum" className={linkClass}>
            {t("auth.login.forgot")}
          </LocalizedLink>
        </p>

        {/* Misafir olarak rezervasyon yapanın hesabı zaten açılmıştır ama şifresi yoktur */}
        <Alert tone="info">{t("auth.login.guestHint")}</Alert>
      </form>
    </AuthShell>
  );
};

export default LoginPage;
