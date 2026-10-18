import { LOCALE_TAGS, langFromPath } from "../i18n";

// Sayı/tarih biçimi sayfanın diline göre (ör. "tr-TR"). Dil adresten okunur:
// admin paneli (/admin) her zaman Türkçe biçimlenir.
export const currentLocaleTag = () => LOCALE_TAGS[langFromPath(window.location.pathname)];

export const formatNumber = (value: number) => value.toLocaleString(currentLocaleTag());

export const formatDate = (value: string | Date, options?: Intl.DateTimeFormatOptions) =>
  new Date(value).toLocaleDateString(currentLocaleTag(), options);
