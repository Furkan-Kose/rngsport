import { X } from "lucide-react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import LocalizedLink from "../components/LocalizedLink";
import SEO from "../components/SEO";
import WhatsAppIcon from "../components/ui/WhatsAppIcon";
import { Alert, Card } from "../components/ui/kit";
import { whatsappUrl } from "../lib/contact";
import { buttonClass, containerClass, cx, pageClass, widthForm } from "../lib/siteUi";

const OrderFailedPage = () => {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  // Sunucu hata metnini siparişin dilinde adrese koyar
  const error = searchParams.get("error") || t("pages.orderFailed.defaultError");
  const orderId = searchParams.get("id");

  return (
    <div className={pageClass}>
      <SEO noindex title={t("pages.orderFailed.title")} />

      <div className={containerClass}>
        <div className={cx(widthForm, "mt-6")}>
          <Card padding="lg" className="text-center">
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-500/15 text-red-400 mb-4">
              <X className="w-7 h-7" aria-hidden />
            </span>
            <h1 className="text-2xl font-bold text-white">{t("pages.orderFailed.title")}</h1>
            <p className="mt-2 text-zinc-300">{t("pages.orderFailed.text")}</p>

            <Alert tone="danger" className="mt-6 text-left">
              {error}
            </Alert>

            {orderId && (
              <p className="mt-4 text-sm text-zinc-400">
                {t("pages.orderFailed.reference")}{" "}
                <span className="font-mono text-zinc-200">#{orderId.slice(-8).toUpperCase()}</span>
              </p>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <LocalizedLink to="/sepet" className={buttonClass("primary")}>
                {t("pages.orderFailed.retry")}
              </LocalizedLink>
              <a
                href={whatsappUrl(t("common.whatsapp.message"))}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass("secondary")}
              >
                <WhatsAppIcon className="w-4 h-4" />
                {t("pages.orderFailed.contact")}
              </a>
            </div>
          </Card>

          <Card className="mt-6">
            <h2 className="font-semibold text-white mb-3">{t("pages.orderFailed.reasonsTitle")}</h2>
            <ul className="space-y-2 text-sm text-zinc-300 list-disc pl-5 marker:text-zinc-400">
              {(t("pages.orderFailed.reasons", { returnObjects: true }) as string[]).map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderFailedPage;
