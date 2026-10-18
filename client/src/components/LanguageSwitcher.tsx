import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Globe } from "lucide-react";
import { LANGUAGES, LANG_LABELS, type Lang } from "../i18n";
import { stripLang, useLang, withLang } from "../lib/localePath";

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
        <Globe className="w-4 h-4 text-zinc-500 shrink-0" />
        {LANGUAGES.map((code) => (
          <button
            key={code}
            type="button"
            lang={code}
            onClick={() => switchTo(code)}
            aria-pressed={code === lang}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              code === lang
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : "bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:text-white"
            }`}
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
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("common.nav.language")}
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-emerald-500/50 text-zinc-300 hover:text-white text-xs font-semibold transition-all duration-300"
      >
        <Globe className="w-4 h-4" />
        {LANG_LABELS[lang]}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t("common.nav.language")}
          className="absolute right-0 mt-2 w-40 py-1 rounded-xl bg-zinc-900 border border-zinc-700/70 shadow-xl shadow-black/40 z-50"
        >
          {LANGUAGES.map((code) => (
            <li key={code} role="option" aria-selected={code === lang}>
              <button
                type="button"
                lang={code}
                onClick={() => switchTo(code)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
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
