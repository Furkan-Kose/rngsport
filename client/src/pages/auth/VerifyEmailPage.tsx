import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import LocalizedLink from "../../components/LocalizedLink";
import { MailCheck, MailX } from "lucide-react";
import api from "../../lib/api";
import SEO from "../../components/SEO";
import { Card, Spinner } from "../../components/ui/kit";
import { buttonClass, containerClass, pageClass } from "../../lib/siteUi";

type VerifyState = "loading" | "success" | "error";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [state, setState] = useState<VerifyState>(token ? "loading" : "error");
  const [message, setMessage] = useState("");
  // Token tek kullanımlık — StrictMode'un çift effect'inde isteği bir kez at
  const requested = useRef(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!token || requested.current) return;
    requested.current = true;

    const verify = async () => {
      try {
        const { data } = await api.post("/api/auth/verify-email", { token });
        setMessage(data.message || t("auth.verify.successDefault"));
        setState("success");
      } catch (err: unknown) {
        const errorObj = err as { response?: { data?: { message?: string } } };
        setMessage(errorObj.response?.data?.message || t("auth.verify.errorDefault"));
        setState("error");
      }
    };
    verify();
    // t yalnızca yedek mesaj için; token değişmedikçe istek tekrarlanmamalı
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className={pageClass}>
      <SEO noindex title={t("auth.verify.seoTitle")} description={t("auth.verify.seoDescription")} />

      <div className={containerClass}>
        <Card padding="lg" className="max-w-md mx-auto mt-6 text-center">
          {state === "loading" && (
            <>
              <Spinner className="py-4" label={t("auth.verify.verifying")} />
              <h1 className="text-xl font-semibold text-white">{t("auth.verify.verifying")}</h1>
            </>
          )}

          {state === "success" && (
            <>
              <MailCheck className="w-10 h-10 text-emerald-400 mx-auto mb-4" aria-hidden />
              <h1 className="text-xl font-semibold text-white mb-2">{t("auth.verify.successTitle")}</h1>
              <p className="text-zinc-300 mb-6">{message}</p>
              <LocalizedLink to="/profil" className={buttonClass("primary", "lg")}>
                {t("auth.verify.toAccount")}
              </LocalizedLink>
            </>
          )}

          {state === "error" && (
            <>
              <MailX className="w-10 h-10 text-red-400 mx-auto mb-4" aria-hidden />
              <h1 className="text-xl font-semibold text-white mb-2">{t("auth.verify.errorTitle")}</h1>
              <p className="text-zinc-300 mb-4">{message || t("auth.verify.errorDefault")}</p>
              <p className="text-sm text-zinc-400">
                {t("auth.verify.errorHintBefore")}{" "}
                <LocalizedLink to="/profil" className="text-emerald-400 hover:text-emerald-300 underline">
                  {t("auth.verify.errorHintLink")}
                </LocalizedLink>
                {t("auth.verify.errorHintAfter")}
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
