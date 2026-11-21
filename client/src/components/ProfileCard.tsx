import { useState, type FormEvent } from "react";
import { Pencil } from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { Button, Card, Field, Input } from "./ui/kit";

const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex flex-wrap gap-x-4 gap-y-0.5 py-2.5">
    <dt className="w-32 shrink-0 text-zinc-400">{label}</dt>
    <dd className="text-zinc-100 break-all">{value || "—"}</dd>
  </div>
);

/**
 * Hesap bilgileri kartı — görüntüleme ve düzenleme.
 *
 * Sporcu bilgileri rezervasyon formunu ön-doldurduğu için kullanıcının bunları
 * kendisi düzeltebilmesi gerekiyor. E-posta buradan değiştirilemez: adres
 * değişimi doğrulama akışı gerektirir (PATCH /api/auth/me de kabul etmiyor).
 */
const ProfileCard = () => {
  const { user, refresh } = useAuth();
  const { t } = useTranslation();
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
      toast.success(t("account.card.updated"));
      setIsEditing(false);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj.response?.data?.message || t("account.card.updateFail"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{t("account.card.title")}</h2>
          <p className="text-sm text-zinc-400">{t("account.card.subtitle")}</p>
        </div>
        {!isEditing && (
          <Button variant="secondary" size="sm" icon={Pencil} onClick={openEdit}>
            {t("account.card.edit")}
          </Button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t("account.card.athleteName")} htmlFor="p-name" hint={t("account.card.athleteNameHint")}>
            <Input
              id="p-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
              minLength={2}
            />
          </Field>

          <Field label={t("account.card.club")} htmlFor="p-club">
            <Input
              id="p-club"
              value={form.clubName}
              onChange={(e) => setForm((p) => ({ ...p, clubName: e.target.value }))}
              placeholder={t("account.card.clubPlaceholder")}
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t("account.card.birthYear")} htmlFor="p-birth">
              <Input
                id="p-birth"
                value={form.birthYear}
                onChange={(e) => setForm((p) => ({ ...p, birthYear: e.target.value }))}
                placeholder="2015"
                inputMode="numeric"
                maxLength={4}
              />
            </Field>

            <Field label={t("account.card.phone")} htmlFor="p-phone">
              <Input
                type="tel"
                id="p-phone"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder={t("account.card.phonePlaceholder")}
                inputMode="tel"
                autoComplete="tel"
              />
            </Field>
          </div>

          <Field label={t("account.card.email")} htmlFor="p-email" hint={t("account.card.emailLocked")}>
            <Input id="p-email" type="email" value={user?.email ?? ""} readOnly />
          </Field>

          <div className="flex flex-wrap gap-3 pt-1">
            <Button type="submit" loading={isSubmitting} className="flex-1 min-w-40">
              {isSubmitting ? t("account.card.saving") : t("account.card.save")}
            </Button>
            <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={isSubmitting}>
              {t("account.card.cancel")}
            </Button>
          </div>
        </form>
      ) : (
        <dl className="divide-y divide-zinc-800 text-sm">
          <InfoRow label={t("account.card.athlete")} value={user?.name} />
          <InfoRow label={t("account.card.club")} value={user?.clubName} />
          <InfoRow label={t("account.card.birthYear")} value={user?.birthYear} />
          <InfoRow label={t("account.card.email")} value={user?.email} />
          <InfoRow label={t("account.card.phone")} value={user?.phone} />
        </dl>
      )}
    </Card>
  );
};

export default ProfileCard;
