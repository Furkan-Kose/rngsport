import { useState, type FormEvent } from "react";
import { Trans, useTranslation } from "react-i18next";
import LocalizedLink from "./LocalizedLink";
import { useLocalizedNavigate } from "../lib/localePath";
import { ArrowRight } from "lucide-react";
import { Button, Card, Field, Input } from "./ui/kit";
import { cx, textLinkClass } from "../lib/siteUi";
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
  const navigate = useLocalizedNavigate();
  const { refresh } = useAuth();
  const { t } = useTranslation();
  const emailTag = { 1: <span className="text-emerald-400" /> };

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  // 409: bu e-postaya ait şifreli bir hesap zaten varmış (kart açıldıktan sonra
  // başka bir sekmede sahiplenilmiş olabilir) — artık şifre sorulmaz.
  const [alreadyExists, setAlreadyExists] = useState(false);

  const linkClass = cx(textLinkClass, "mt-4 text-emerald-400 hover:text-emerald-300");

  if (account.status === "none") return null;

  // Şifreli hesabı olan e-postayla sipariş verildi: kayıt hesaba bağlandı ama
  // şifre SORULMAZ — yoksa başkasının e-postasını yazan kişi hesabı ele geçirirdi.
  if (account.status === "linked" || alreadyExists) {
    return (
      <Card className="mt-6">
        <p className="text-zinc-300">
          <Trans i18nKey="account.claim.linked" values={{ email: account.email }} components={emailTag} />
        </p>
        <LocalizedLink to="/giris?redirect=/galerim" className={linkClass}>
          {t("account.claim.linkedCta")}
          <ArrowRight className="w-4 h-4" aria-hidden />
        </LocalizedLink>
      </Card>
    );
  }

  // 24 saatlik sahiplenme penceresi dolmuş — normal şifre sıfırlama akışı devrede.
  if (account.status === "expired") {
    return (
      <Card className="mt-6">
        <p className="text-zinc-300">
          <Trans i18nKey="account.claim.expired" values={{ email: account.email }} components={emailTag} />
        </p>
        <LocalizedLink to="/sifremi-unuttum" className={linkClass}>
          {t("account.claim.expiredCta")}
          <ArrowRight className="w-4 h-4" aria-hidden />
        </LocalizedLink>
      </Card>
    );
  }

  if (dismissed) {
    return (
      <Card className="mt-6">
        <p className="text-zinc-300">
          <Trans i18nKey="account.claim.dismissed" values={{ email: account.email }} components={emailTag} />
        </p>
      </Card>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError(t("auth.errors.passwordLength"));
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
      setError(res?.data?.message || t("auth.errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mt-6">
      <h2 className="text-lg font-semibold text-white">{t("account.claim.title")}</h2>
      <p className="mt-1 mb-5 text-sm text-zinc-400">{t("account.claim.text")}</p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label={t("auth.email")} htmlFor="claim-email">
          <Input id="claim-email" type="email" value={account.email} readOnly autoComplete="username" />
        </Field>

        <Field
          label={t("auth.password")}
          htmlFor="claim-password"
          required
          error={error || undefined}
          hint={t("auth.passwordPlaceholder")}
        >
          <Input
            type="password"
            id="claim-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            invalid={!!error}
          />
        </Field>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button type="submit" loading={isSubmitting} className="flex-1 min-w-40">
            {isSubmitting ? t("account.claim.creating") : t("account.claim.create")}
          </Button>
          <Button variant="ghost" onClick={() => setDismissed(true)}>
            {t("account.claim.later")}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AccountClaimCard;
