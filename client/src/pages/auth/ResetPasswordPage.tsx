import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import LocalizedLink from "../../components/LocalizedLink";
import { CheckCircle2 } from "lucide-react";
import api from "../../lib/api";
import SEO from "../../components/SEO";
import AuthShell from "../../components/ui/AuthShell";
import { Alert, Button, Field, Input } from "../../components/ui/kit";
import { buttonClass } from "../../lib/siteUi";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  // yeni=1 → hesap sipariş/rezervasyonla otomatik açıldı, bu ilk şifre belirleme
  const isFirstTime = searchParams.get("yeni") === "1";

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  // Alan hataları (biçim) ve sunucu hatası (geçersiz/süresi dolmuş bağlantı) ayrı
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError("");

    const lengthError = password.length < 8 ? t("auth.errors.passwordLength") : "";
    const mismatch = password !== passwordConfirm ? t("auth.errors.passwordMismatch") : "";
    setPasswordError(lengthError);
    setConfirmError(mismatch);
    if (lengthError || mismatch) return;

    setIsSubmitting(true);

    try {
      await api.post("/api/auth/reset-password", { token, password });
      setIsDone(true);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setServerError(errorObj.response?.data?.message || t("auth.errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={isFirstTime ? t("auth.reset.titleFirst") : t("auth.reset.title")}
      subtitle={isFirstTime && !isDone ? t("auth.reset.firstHint") : undefined}
    >
      <SEO
        noindex
        title={isFirstTime ? t("auth.reset.seoTitleFirst") : t("auth.reset.seoTitle")}
        description={t("auth.reset.seoDescription")}
      />

      {isDone ? (
        <div className="text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-4" aria-hidden />
          <h2 className="text-lg font-semibold text-white mb-2">
            {isFirstTime ? t("auth.reset.doneTitleFirst") : t("auth.reset.doneTitle")}
          </h2>
          <p className="text-zinc-300 mb-6">
            {isFirstTime ? t("auth.reset.doneTextFirst") : t("auth.reset.doneText")}
          </p>
          <LocalizedLink
            to={isFirstTime ? "/giris?redirect=/galerim" : "/giris"}
            className={buttonClass("primary", "lg")}
          >
            {t("auth.reset.login")}
          </LocalizedLink>
        </div>
      ) : !token ? (
        <div className="text-center">
          <p className="text-zinc-300 mb-6">{t("auth.reset.invalidLink")}</p>
          <LocalizedLink to="/sifremi-unuttum" className={buttonClass("secondary")}>
            {t("auth.reset.requestNew")}
          </LocalizedLink>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {serverError && (
            <Alert tone="danger">
              <p>{serverError}</p>
              <LocalizedLink to="/sifremi-unuttum" className="underline">
                {t("auth.reset.requestNew")}
              </LocalizedLink>
            </Alert>
          )}

          <Field
            label={isFirstTime ? t("auth.password") : t("auth.newPassword")}
            htmlFor="password"
            required
            error={passwordError || undefined}
            hint={t("auth.passwordPlaceholder")}
          >
            <Input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              invalid={!!passwordError}
            />
          </Field>

          <Field
            label={isFirstTime ? t("auth.passwordConfirm") : t("auth.newPasswordConfirm")}
            htmlFor="passwordConfirm"
            required
            error={confirmError || undefined}
          >
            <Input
              type="password"
              id="passwordConfirm"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
              invalid={!!confirmError}
            />
          </Field>

          <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
            {isSubmitting ? t("auth.reset.submitting") : t("auth.reset.submit")}
          </Button>
        </form>
      )}
    </AuthShell>
  );
};

export default ResetPasswordPage;
