import { useEffect, useLayoutEffect } from "react";
import { Outlet } from "react-router";
import { useTranslation } from "react-i18next";
import type { Lang } from "../i18n";

// Müşteri sitesinin kökü: dili adresin önekinden alır (/en → İngilizce).
// Dil adres değişince değişir; tarayıcıda ayrıca saklanmaz — link hangi dildeyse o.
const LocaleRoot = ({ lang }: { lang: Lang }) => {
  const { i18n } = useTranslation();

  // Boyamadan önce dili değiştir; eşleşene kadar (tek kare) eski dille çizme
  useLayoutEffect(() => {
    if (i18n.language !== lang) void i18n.changeLanguage(lang);
  }, [i18n, lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  if (i18n.language !== lang) return null;
  return <Outlet />;
};

export default LocaleRoot;
