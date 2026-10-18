import { useNavigate, type NavigateOptions } from "react-router";
import { useTranslation } from "react-i18next";
import { DEFAULT_LANG, LOCALE_TAGS, isLang, type Lang } from "../i18n";

// Dil önekli adresler: Türkçe öneksiz (/sepet), diğerleri /en/sepet, /ru/sepet.

// "/en/sepet" → "/sepet"; Türkçe adres zaten öneksiz
export const stripLang = (pathname: string) => {
  const [, first, ...rest] = pathname.split("/");
  if (isLang(first) && first !== DEFAULT_LANG) return "/" + rest.join("/");
  return pathname;
};

// "/sepet" → "/en/sepet", "/" → "/en", "/#paketler" → "/en#paketler".
// Göreli ve dış adreslere dokunmaz.
export const withLang = (path: string, lang: Lang) => {
  // Admin paneli tek dilli (Türkçe) ve öneksiz
  if (!path.startsWith("/") || path.startsWith("/admin")) return path;
  // Zaten önekliyse önce sök: "/en/profil" → "/ru/profil" (çift önek olmasın)
  path = stripLang(path);
  if (lang === DEFAULT_LANG) return path;
  if (path === "/") return `/${lang}`;
  if (path[1] === "#" || path[1] === "?") return `/${lang}${path.slice(1)}`;
  return `/${lang}${path}`;
};

export const useLang = (): Lang => {
  const { i18n } = useTranslation();
  return isLang(i18n.language) ? i18n.language : DEFAULT_LANG;
};

// Sayfa içi bağlantılar: localize("/sepet") → o anki dilin adresi
export const useLocalizedPath = () => {
  const lang = useLang();
  return (path: string) => withLang(path, lang);
};

export const useLocalizedNavigate = () => {
  const navigate = useNavigate();
  const localize = useLocalizedPath();
  return (to: string, options?: NavigateOptions) => navigate(localize(to), options);
};

// Tarih/sayı biçimi için o anki dilin yerel ayarı (ör. "tr-TR")
export const useLocaleTag = () => LOCALE_TAGS[useLang()];
