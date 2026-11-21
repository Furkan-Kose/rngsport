import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import LocalizedLink from "../../components/LocalizedLink";
import { MailCheck } from "lucide-react";
import api from "../../lib/api";
import SEO from "../../components/SEO";
import AuthShell from "../../components/ui/AuthShell";
import { Alert, Button, Field, Input } from "../../components/ui/kit";
import { buttonClass } from "../../lib/siteUi";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await api.post("/api/auth/forgot-password", { email: email.trim() });
      setIsSent(true);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(errorObj.response?.data?.message || t("auth.errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={t("auth.forgot.title")}
      subtitle={isSent ? undefined : t("auth.forgot.subtitle")}
      footer={
        !isSent && (
          <>
            {t("auth.forgot.remember")}{" "}
            <LocalizedLink
              to="/giris"
              className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-4"
            >
              {t("auth.forgot.login")}
            </LocalizedLink>
          </>
        )
      }
    >
      <SEO noindex title={t("auth.forgot.seoTitle")} description={t("auth.forgot.seoDescription")} />

      {isSent ? (
        <div className="text-center">
          <MailCheck className="w-10 h-10 text-emerald-400 mx-auto mb-4" aria-hidden />
          <h2 className="text-lg font-semibold text-white mb-2">{t("auth.forgot.sentTitle")}</h2>
          <p className="text-zinc-300 mb-6">{t("auth.forgot.sentText")}</p>
          <LocalizedLink to="/giris" className={buttonClass("secondary")}>
            {t("auth.forgot.backToLogin")}
          </LocalizedLink>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <Alert tone="danger">{error}</Alert>}

          <Field label={t("auth.email")} htmlFor="email" required>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.emailPlaceholder")}
              inputMode="email"
              autoComplete="username"
              required
            />
          </Field>

          <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
            {isSubmitting ? t("auth.forgot.submitting") : t("auth.forgot.submit")}
          </Button>
        </form>
      )}
    </AuthShell>
  );
};

export default ForgotPasswordPage;
