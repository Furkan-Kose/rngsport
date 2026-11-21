import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import WhatsAppIcon from "./ui/WhatsAppIcon";
import { whatsappUrl } from "../lib/contact";
import { stripLang } from "../lib/localePath";
import { cx } from "../lib/siteUi";

// Form doldurulan sayfalarda düğme küçük kalır (yazı yok): alttaki özet ve
// gönder düğmelerinin üstünü kapatmasın.
const COMPACT_PREFIXES = ["/sepet", "/rezervasyon", "/urunler/"];

const WpButton = () => {
  const { t } = useTranslation();
  const path = stripLang(useLocation().pathname);
  const compact = COMPACT_PREFIXES.some((p) => path.startsWith(p));

  return (
    <a
      href={whatsappUrl(t("common.whatsapp.message"))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("common.whatsapp.aria")}
      className={cx(
        // wp-float: altta sabit çubuk açıkken yukarı kayar (index.css)
        "wp-float fixed bottom-5 right-5 z-40 flex items-center justify-center gap-2.5 h-13 w-13 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-black/40 transition-[background-color,bottom]",
        !compact && "md:w-auto md:px-5",
      )}
    >
      <WhatsAppIcon className="w-6 h-6" />
      {!compact && <span className="hidden md:block font-semibold text-sm">{t("common.whatsapp.label")}</span>}
    </a>
  );
};

export default WpButton;
