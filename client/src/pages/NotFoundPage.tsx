import { Compass } from "lucide-react";
import { useTranslation } from "react-i18next";
import SEO from "../components/SEO";
import LocalizedLink from "../components/LocalizedLink";
import { EmptyState } from "../components/ui/kit";
import { buttonClass, containerClass, pageClass, widthForm } from "../lib/siteUi";

// Eşleşmeyen her adres (yanlış yazılmış ya da kaldırılmış sayfa)
const NotFoundPage = () => {
  const { t } = useTranslation();
  return (
    <div className={pageClass}>
      <SEO title={t("pages.notFound.title")} noindex />
      <div className={containerClass}>
        <EmptyState
          icon={Compass}
          title={t("pages.notFound.title")}
          description={t("pages.notFound.description")}
          className={`${widthForm} mt-10`}
        >
          <LocalizedLink to="/" className={buttonClass("primary")}>
            {t("common.backHome")}
          </LocalizedLink>
          <LocalizedLink to="/paketler" className={buttonClass("secondary")}>
            {t("common.nav.packages")}
          </LocalizedLink>
        </EmptyState>
      </div>
    </div>
  );
};

export default NotFoundPage;
