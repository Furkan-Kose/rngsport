import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { LANGUAGES, DEFAULT_LANG, type Lang } from "../i18n";
import { stripLang, withLang, useLang } from "../lib/localePath";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: string;
}

const SITE_NAME = "RNG Sport";
const DEFAULT_IMAGE = "/og-image.jpg";
const SITE_URL = "https://rngsport.com";

const OG_LOCALES: Record<Lang, string> = { tr: "tr_TR", en: "en_GB", ru: "ru_RU" };
const LANGUAGE_NAMES: Record<Lang, string> = { tr: "Turkish", en: "English", ru: "Russian" };

// React 19 <title>/<meta>/<link> etiketlerini kendisi <head>'e taşır.
// (react-helmet-async React 19'da yalnızca başlığı yazıyordu.)
// Kanonik adres ve hreflang alternatifleri o anki adresten türetilir:
// aynı sayfanın üç dildeki karşılığı arama motorlarına bildirilir.
const SEO = ({
  title,
  description,
  keywords,
  image = DEFAULT_IMAGE,
  type = "website",
}: SEOProps) => {
  const { t } = useTranslation();
  const lang = useLang();
  const { pathname } = useLocation();

  const basePath = stripLang(pathname);
  const urlFor = (l: Lang) => {
    const path = withLang(basePath, l);
    return `${SITE_URL}${path === "/" ? "" : path}`;
  };
  const url = urlFor(lang);

  const desc = description ?? t("home.seo.defaultDescription");
  const kw = keywords ?? t("home.seo.defaultKeywords");
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const fullImage = image.startsWith("http") ? image : `${SITE_URL}${image}`;

  return (
    <>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta name="keywords" content={kw} />
      <link rel="canonical" href={url} />
      {LANGUAGES.map((l) => (
        <link key={l} rel="alternate" hrefLang={l} href={urlFor(l)} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={urlFor(DEFAULT_LANG)} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={OG_LOCALES[lang]} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={fullImage} />

      {/* Additional SEO Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="author" content="RNG Sport" />
      <meta name="language" content={LANGUAGE_NAMES[lang]} />
      <meta name="revisit-after" content="7 days" />
    </>
  );
};

export default SEO;
