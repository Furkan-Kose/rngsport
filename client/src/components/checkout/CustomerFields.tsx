import type { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { Field, Input, Textarea } from "../ui/kit";
import type { CustomerForm, CustomerFormErrors } from "../../lib/customerForm";

interface CustomerFieldsProps {
  /** Alan id'lerinin öneki (aynı sayfada iki form olmasın diye) */
  idPrefix: string;
  form: CustomerForm;
  errors: CustomerFormErrors;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** Düzenlemede e-posta değiştirilemez (hesaba bağlı) */
  emailLocked?: boolean;
}

/** Rezervasyon ve sepet formlarının ortak sporcu / iletişim alanları */
const CustomerFields = ({ idPrefix, form, errors, onChange, emailLocked = false }: CustomerFieldsProps) => {
  const { t } = useTranslation();
  const id = (name: keyof CustomerForm) => `${idPrefix}-${name}`;

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <Field label={t("checkout.form.athleteName")} htmlFor={id("athleteName")} required error={errors.athleteName}>
        <Input
          id={id("athleteName")}
          name="athleteName"
          value={form.athleteName}
          onChange={onChange}
          placeholder={t("checkout.form.athleteNamePlaceholder")}
          autoComplete="off"
          invalid={!!errors.athleteName}
        />
      </Field>

      <Field label={t("checkout.form.clubName")} htmlFor={id("clubName")} required error={errors.clubName}>
        <Input
          id={id("clubName")}
          name="clubName"
          value={form.clubName}
          onChange={onChange}
          placeholder={t("checkout.form.clubNamePlaceholder")}
          autoComplete="organization"
          invalid={!!errors.clubName}
        />
      </Field>

      <Field label={t("checkout.form.birthYear")} htmlFor={id("birthYear")} required error={errors.birthYear}>
        <Input
          id={id("birthYear")}
          name="birthYear"
          value={form.birthYear}
          onChange={onChange}
          placeholder={t("checkout.form.birthYearPlaceholder")}
          inputMode="numeric"
          maxLength={4}
          autoComplete="off"
          invalid={!!errors.birthYear}
        />
      </Field>

      <Field label={t("checkout.form.phone")} htmlFor={id("customerPhone")} required error={errors.customerPhone}>
        <Input
          id={id("customerPhone")}
          type="tel"
          name="customerPhone"
          value={form.customerPhone}
          onChange={onChange}
          placeholder="0532 123 45 67"
          inputMode="tel"
          autoComplete="tel"
          invalid={!!errors.customerPhone}
        />
      </Field>

      <Field
        className="sm:col-span-2"
        label={t("checkout.form.email")}
        htmlFor={id("customerEmail")}
        required
        error={errors.customerEmail}
        hint={emailLocked ? t("checkout.form.emailLocked") : t("checkout.form.emailHint")}
      >
        <Input
          id={id("customerEmail")}
          type="email"
          name="customerEmail"
          value={form.customerEmail}
          onChange={onChange}
          readOnly={emailLocked}
          placeholder={t("checkout.form.emailPlaceholder")}
          inputMode="email"
          autoComplete="email"
          invalid={!!errors.customerEmail}
        />
      </Field>

      <Field
        className="sm:col-span-2"
        label={
          <>
            {t("checkout.form.notes")} <span className="font-normal text-zinc-400">{t("checkout.form.optional")}</span>
          </>
        }
        htmlFor={id("notes")}
      >
        <Textarea
          id={id("notes")}
          name="notes"
          value={form.notes}
          onChange={onChange}
          placeholder={t("checkout.form.notesPlaceholder")}
          rows={3}
        />
      </Field>
    </div>
  );
};

export default CustomerFields;
