import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Globe } from "lucide-react";
import { LANGUAGES, LANG_LABELS, type Lang } from "../i18n";
import { stripLang, useLang, withLang } from "../lib/localePath";
import { buttonClass, chipClass } from "../lib/siteUi";

// Dil kendi adıyla yazılır, bayrak yok: bayrak ülkeyi gösterir, dili değil
// (Rusça konuşan ziyaretçilerin çoğu Azerbaycan, Özbekistan vb. ülkelerden).
const NATIVE_NAMES: Record<Lang, string> = { tr: "Türkçe", en: "English", ru: "Русский" };

interface Props {
  className?: string;
  /** "dropdown": masaüstü menüde 🌐 TR ▾; "list": mobil menüde tam adlar yan yana */
  variant?: "dropdown" | "list";
}

// Aynı sayfanın diğer dildeki adresine gider (sorgu ve # korunur)
const LanguageSwitcher = ({ className = "", variant = "dropdown" }: Props) => {
  const lang = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const switchTo = (next: Lang) => {
    setOpen(false);
    if (next === lang) return;
    navigate(withLang(stripLang(location.pathname), next) + location.search + location.hash);
  };

  // Dışarı tıklayınca veya Esc ile kapanır
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (variant === "list") {
    return (
      <div role="group" aria-label={t("common.nav.language")} className={`flex items-center gap-2 ${className}`}>
        <Globe className="w-4 h-4 text-zinc-400 shrink-0" />
        {LANGUAGES.map((code) => (
          <button
            key={code}
            type="button"
            lang={code}
            onClick={() => switchTo(code)}
            aria-pressed={code === lang}
            className={chipClass(code === lang)}
          >
            {NATIVE_NAMES[code]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t("common.nav.language")}
        className={buttonClass("secondary", "sm", "px-2.5 gap-1.5 text-xs")}
      >
        <Globe className="w-4 h-4" aria-hidden />
        {LANG_LABELS[lang]}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          aria-label={t("common.nav.language")}
          className="absolute right-0 mt-2 w-40 py-1 rounded-xl bg-zinc-900 border border-zinc-700 shadow-lg shadow-black/40 z-50"
        >
          {LANGUAGES.map((code) => (
            <li key={code}>
              <button
                type="button"
                lang={code}
                onClick={() => switchTo(code)}
                aria-current={code === lang ? "true" : undefined}
                className={`w-full flex items-center justify-between min-h-10 px-3 text-sm transition-colors ${
                  code === lang ? "text-emerald-300" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                {NATIVE_NAMES[code]}
                {code === lang && <Check className="w-4 h-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LanguageSwitcher;
