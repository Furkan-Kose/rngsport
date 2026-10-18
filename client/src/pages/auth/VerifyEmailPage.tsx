import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import LocalizedLink from "../../components/LocalizedLink";
import { motion } from "framer-motion";
import { MailCheck, MailX, Loader2 } from "lucide-react";
import api from "../../lib/api";
import SEO from "../../components/SEO";

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
    <div className="min-h-screen bg-zinc-950 pt-28 pb-16">
      <SEO title={t("auth.verify.seoTitle")} description={t("auth.verify.seoDescription")} />

      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md mx-auto"
        >
          <div className="relative bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 text-center">
            <div className="absolute -top-px left-6 right-6 h-px bg-linear-to-r from-transparent via-emerald-500/40 to-transparent" />

            {state === "loading" && (
              <>
                <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto mb-4" />
                <h1 className="text-xl font-semibold text-white">{t("auth.verify.verifying")}</h1>
              </>
            )}

            {state === "success" && (
              <>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-4">
                  <MailCheck className="w-7 h-7 text-emerald-400" />
                </div>
                <h1 className="text-xl font-semibold text-white mb-2">{t("auth.verify.successTitle")}</h1>
                <p className="text-sm text-zinc-400 mb-6">{message}</p>
                <LocalizedLink
                  to="/profil"
                  className="inline-block py-3 px-8 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold transition-all duration-300"
                >
                  {t("auth.verify.toAccount")}
                </LocalizedLink>
              </>
            )}

            {state === "error" && (
              <>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 mb-4">
                  <MailX className="w-7 h-7 text-red-400" />
                </div>
                <h1 className="text-xl font-semibold text-white mb-2">{t("auth.verify.errorTitle")}</h1>
                <p className="text-sm text-zinc-400 mb-6">
                  {message || t("auth.verify.errorDefault")}
                </p>
                <p className="text-sm text-zinc-500">
                  {t("auth.verify.errorHintBefore")}{" "}
                  <LocalizedLink to="/profil" className="text-emerald-400 hover:text-emerald-300 underline">
                    {t("auth.verify.errorHintLink")}
                  </LocalizedLink>
                  {t("auth.verify.errorHintAfter")}
                </p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
