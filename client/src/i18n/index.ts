import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import tr from "../locales/tr";
import en from "../locales/en";
import ru from "../locales/ru";

// Müşteri sitesinin dilleri. Türkçe varsayılan ve ön eksiz (/rezervasyon);
// diğerleri adreste ön ekle (/en/rezervasyon, /ru/rezervasyon). Admin paneli Türkçe.
export const LANGUAGES = ["tr", "en", "ru"] as const;
export type Lang = (typeof LANGUAGES)[number];
export const DEFAULT_LANG: Lang = "tr";

export const LANG_LABELS: Record<Lang, string> = { tr: "TR", en: "EN", ru: "RU" };
// Tarih/sayı biçimlendirme için
export const LOCALE_TAGS: Record<Lang, string> = { tr: "tr-TR", en: "en-GB", ru: "ru-RU" };

export const isLang = (value: unknown): value is Lang =>
  typeof value === "string" && (LANGUAGES as readonly string[]).includes(value);

// Adresin ilk parçası dil öneki mi? (/en/... → en, diğer her şey → tr)
export const langFromPath = (pathname: string): Lang => {
  const first = pathname.split("/")[1];
  return isLang(first) && first !== DEFAULT_LANG ? first : DEFAULT_LANG;
};

i18n.use(initReactI18next).init({
  resources: {
    tr: { translation: tr },
    en: { translation: en },
    ru: { translation: ru },
  },
  // İlk render doğru dilde olsun diye dil, açılıştaki adresten belirlenir
  lng: langFromPath(window.location.pathname),
  fallbackLng: DEFAULT_LANG,
  interpolation: { escapeValue: false }, // React zaten kaçışlıyor
  returnNull: false,
});

export default i18n;
