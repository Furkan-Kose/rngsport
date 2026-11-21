import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { DEFAULT_LANG, isLang, type Lang } from "../i18n";
import { stripLang, useLang, withLang } from "../lib/localePath";
import { Button, IconButton } from "./ui/kit";

const DISMISS_KEY = "rngsport-lang-banner-dismissed";

// Tarayıcı dili İngilizce/Rusça olan ziyaretçi Türkçe sayfaya gelirse dil değiştirmeyi
// önerir. Zorla yönlendirmez: paylaşılan Türkçe link Türkçe açılır.
const browserLang = (): Lang | null => {
  const code = (navigator.language || "").slice(0, 2).toLowerCase();
  return isLang(code) && code !== DEFAULT_LANG ? code : null;
};

const isDismissed = () => {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
};

const LangSuggestBanner = () => {
  const lang = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [hidden, setHidden] = useState(isDismissed);
  const suggested = browserLang();

  if (hidden || lang !== DEFAULT_LANG || !suggested) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // gizli sekme vb. — sadece bu oturumda kapanır
    }
  };

  // Metin önerilen dilde gösterilir (ziyaretçi Türkçe bilmiyor olabilir)
  const tt = (key: string) => t(`common.langBanner.${key}`, { lng: suggested });

  return (
    <div className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-5 sm:w-96 z-40 flex items-center gap-2 rounded-2xl bg-zinc-900 border border-zinc-700 pl-4 pr-1.5 py-1.5 shadow-lg shadow-black/40">
      <p className="flex-1 text-sm text-zinc-200">{tt("text")}</p>
      <Button
        size="sm"
        onClick={() => {
          dismiss();
          navigate(withLang(stripLang(location.pathname), suggested) + location.search + location.hash);
        }}
      >
        {tt("switch")}
      </Button>
      <IconButton variant="ghost" icon={X} label={tt("dismiss")} onClick={dismiss} />
    </div>
  );
};

export default LangSuggestBanner;
