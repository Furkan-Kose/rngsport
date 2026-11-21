import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import LocalizedLink from "../../components/LocalizedLink";
import { useLocalizedNavigate } from "../../lib/localePath";
import { useAuth } from "../../context/AuthContext";
import SEO from "../../components/SEO";
import AuthShell from "../../components/ui/AuthShell";
import KvkkCheckbox from "../../components/checkout/KvkkCheckbox";
import { Alert, Button, Field, Input } from "../../components/ui/kit";

type FormKey = "name" | "clubName" | "birthYear" | "phone" | "email" | "password" | "passwordConfirm";
type Errors = Partial<Record<FormKey | "kvkk", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RegisterPage = () => {
  // name = sporcu adı soyadı. Rezervasyon formu ve çekim listesi eşleşmesi bunu
  // kullanıyor, o yüzden hesapta sporcunun kendi adı tutuluyor.
  const [form, setForm] = useState<Record<FormKey, string>>({
    name: "",
    clubName: "",
    birthYear: "",
    phone: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, isAuthenticated, isAdmin, isLoading } = useAuth();
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

  const updateForm = (key: FormKey, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): Errors => {
    const e: Errors = {};
    const err = (key: string) => t(`checkout.form.errors.${key}`);
    if (form.name.trim().length < 2) e.name = err("athleteName");
    if (form.clubName.trim().length < 2) e.clubName = err("clubName");
    const year = form.birthYear.trim();
    if (!year) e.birthYear = err("birthYear");
    else if (!/^\d{4}$/.test(year) || Number(year) < 1950 || Number(year) > new Date().getFullYear())
      e.birthYear = err("birthYearInvalid");
    if (!form.phone.trim()) e.phone = err("phone");
    else if (form.phone.replace(/\D/g, "").length < 10) e.phone = err("phoneInvalid");
    if (!form.email.trim()) e.email = err("email");
    else if (!EMAIL_RE.test(form.email.trim())) e.email = err("emailInvalid");
    if (form.password.length < 8) e.password = t("auth.errors.passwordLength");
    if (form.password !== form.passwordConfirm) e.passwordConfirm = t("auth.errors.passwordMismatch");
    if (!kvkkAccepted) e.kvkk = err("kvkk");
    return e;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError("");

    const found = validate();
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      document.getElementById(first)?.focus();
      return;
    }

    setIsSubmitting(true);

    const result = await register({
      name: form.name.trim(),
      clubName: form.clubName.trim(),
      birthYear: form.birthYear.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      password: form.password,
    });

    if (result.success) {
      navigate(redirect, { replace: true });
    } else {
      setServerError(result.message || t("auth.errors.registerFailed"));
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      wide
      title={t("auth.register.title")}
      subtitle={t("auth.register.subtitle")}
      footer={
        <>
          {t("auth.register.hasAccount")}{" "}
          <LocalizedLink
            to={`/giris${redirect !== "/profil" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
            className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-4"
          >
            {t("auth.register.login")}
          </LocalizedLink>
        </>
      }
    >
      <SEO
        noindex
        title={t("auth.register.seoTitle")}
        description={t("auth.register.seoDescription")}
        keywords={t("auth.register.seoKeywords")}
      />

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {serverError && <Alert tone="danger">{serverError}</Alert>}

        <div className="grid sm:grid-cols-2 gap-5 items-start">
        <Field
          label={t("auth.register.athleteName")}
          htmlFor="name"
          required
          error={errors.name}
          hint={t("auth.register.athleteNameHint")}
        >
          <Input
            id="name"
            value={form.name}
            onChange={(e) => updateForm("name", e.target.value)}
            placeholder={t("auth.register.athleteNamePlaceholder")}
            autoComplete="off"
            invalid={!!errors.name}
          />
        </Field>

        <Field label={t("auth.register.club")} htmlFor="clubName" required error={errors.clubName}>
          <Input
            id="clubName"
            value={form.clubName}
            onChange={(e) => updateForm("clubName", e.target.value)}
            placeholder={t("auth.register.clubPlaceholder")}
            autoComplete="organization"
            invalid={!!errors.clubName}
          />
        </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 items-start">
          <Field label={t("auth.register.birthYear")} htmlFor="birthYear" required error={errors.birthYear}>
            <Input
              id="birthYear"
              value={form.birthYear}
              onChange={(e) => updateForm("birthYear", e.target.value)}
              placeholder="2015"
              inputMode="numeric"
              maxLength={4}
              autoComplete="off"
              invalid={!!errors.birthYear}
            />
          </Field>

          <Field label={t("auth.register.phone")} htmlFor="phone" required error={errors.phone}>
            <Input
              type="tel"
              id="phone"
              value={form.phone}
              onChange={(e) => updateForm("phone", e.target.value)}
              placeholder={t("auth.register.phonePlaceholder")}
              inputMode="tel"
              autoComplete="tel"
              invalid={!!errors.phone}
            />
          </Field>
        </div>

        <Field label={t("auth.email")} htmlFor="email" required error={errors.email}>
          <Input
            type="email"
            id="email"
            value={form.email}
            onChange={(e) => updateForm("email", e.target.value)}
            placeholder={t("auth.emailPlaceholder")}
            inputMode="email"
            autoComplete="username"
            invalid={!!errors.email}
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-5 items-start">
        <Field
          label={t("auth.password")}
          htmlFor="password"
          required
          error={errors.password}
          hint={t("auth.passwordPlaceholder")}
        >
          <Input
            type="password"
            id="password"
            value={form.password}
            onChange={(e) => updateForm("password", e.target.value)}
            autoComplete="new-password"
            invalid={!!errors.password}
          />
        </Field>

        <Field label={t("auth.passwordConfirm")} htmlFor="passwordConfirm" required error={errors.passwordConfirm}>
          <Input
            type="password"
            id="passwordConfirm"
            value={form.passwordConfirm}
            onChange={(e) => updateForm("passwordConfirm", e.target.value)}
            autoComplete="new-password"
            invalid={!!errors.passwordConfirm}
          />
        </Field>
        </div>

        <div>
          <KvkkCheckbox
            checked={kvkkAccepted}
            onChange={(checked) => {
              setKvkkAccepted(checked);
              if (checked) setErrors((prev) => ({ ...prev, kvkk: undefined }));
            }}
          />
          {errors.kvkk && <p className="mt-1.5 text-sm text-red-400">{errors.kvkk}</p>}
        </div>

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          {isSubmitting ? t("auth.register.submitting") : t("auth.register.submit")}
        </Button>
      </form>
    </AuthShell>
  );
};

export default RegisterPage;
