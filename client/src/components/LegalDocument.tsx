import { Fragment } from "react";
import { ArrowLeft, Info } from "lucide-react";
import { useLocation } from "react-router";
import { Link } from "react-router";
import SEO from "./SEO";
import LocalizedLink from "./LocalizedLink";
import { stripLang } from "../lib/localePath";
import { LEGAL_UI, type LegalBlock, type LegalDoc } from "../data/legal";

// Metindeki **kalın** ve [bağlantı](/yol) işaretlerini işler
const INLINE = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

const RichText = ({ text }: { text: string }) => (
  <>
    {text.split(INLINE).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="text-zinc-100">
            {part.slice(2, -2)}
          </strong>
        );
      }
      const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        return (
          <LocalizedLink key={i} to={link[2]} className="text-emerald-400 hover:text-emerald-300 underline">
            {link[1]}
          </LocalizedLink>
        );
      }
      return <Fragment key={i}>{part}</Fragment>;
    })}
  </>
);

const NOTE_TONES = {
  info: "bg-emerald-500/10 border-emerald-500/20",
  success: "bg-emerald-500/10 border-emerald-500/20",
  warning: "bg-amber-500/10 border-amber-500/20",
  danger: "bg-red-500/10 border-red-500/20",
} as const;

const Block = ({ block }: { block: LegalBlock }) => {
  switch (block.type) {
    case "p":
      return (
        <p className="text-zinc-300 leading-relaxed mb-4 last:mb-0">
          <RichText text={block.text} />
        </p>
      );
    case "list": {
      const danger = block.tone === "danger";
      return (
        <div
          className={`rounded-xl p-6 mb-4 last:mb-0 border ${
            danger ? "bg-red-500/10 border-red-500/20" : "bg-zinc-800/40 border-zinc-700/60"
          }`}
        >
          {block.title && <h4 className="text-zinc-100 font-semibold mb-3">{block.title}</h4>}
          <ul className="space-y-2">
            {block.items.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-zinc-300">
                <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${danger ? "bg-red-500" : "bg-emerald-500"}`} />
                <span>
                  <RichText text={item} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    case "note":
      return (
        <div className={`rounded-xl p-6 mb-4 last:mb-0 border ${NOTE_TONES[block.tone ?? "info"]}`}>
          <p className="text-zinc-200 leading-relaxed">
            <RichText text={block.text} />
          </p>
        </div>
      );
    case "numbered":
      return (
        <div className="bg-zinc-800/40 rounded-xl p-5 border border-zinc-700/60 space-y-4 mb-4 last:mb-0">
          {block.items.map((item) => (
            <div key={item.n} className="flex items-start gap-3">
              <span className="text-emerald-400 font-bold">{item.n}</span>
              <p className="text-zinc-300 leading-relaxed">
                <RichText text={item.text} />
              </p>
            </div>
          ))}
        </div>
      );
    case "fields":
      return (
        <div className="bg-emerald-500/10 rounded-xl p-6 border border-emerald-500/20 mb-4 last:mb-0">
          {block.title && <h4 className="text-zinc-100 font-semibold mb-3">{block.title}</h4>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {block.rows.map((row) => (
              <div key={row.label}>
                <p className="text-zinc-400 text-sm mb-1">{row.label}</p>
                {row.href ? (
                  <a href={row.href} className="text-emerald-400 hover:text-emerald-300 transition-colors break-all">
                    {row.value}
                  </a>
                ) : (
                  <p className="text-zinc-100">{row.value}</p>
                )}
              </div>
            ))}
          </div>
          {block.footnote && <p className="text-zinc-400 text-sm mt-3 italic">{block.footnote}</p>}
        </div>
      );
  }
};

/**
 * Yasal metnin İngilizce/Rusça çevirisi. Türkçe sayfalarla aynı görünüm; en üstte
 * "bağlayıcı olan Türkçe metindir" notu ve Türkçe asıl metne bağlantı var.
 */
const LegalDocument = ({ doc, lang }: { doc: LegalDoc; lang: "en" | "ru" }) => {
  const { pathname } = useLocation();
  const ui = LEGAL_UI[lang];

  return (
    <div className="min-h-screen pt-20">
      <SEO title={doc.seoTitle} description={doc.seoDescription} />
      <div className="border-b border-zinc-800">
        <div className="container mx-auto px-4 py-6">
          <LocalizedLink
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{ui.backHome}</span>
          </LocalizedLink>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Bağlayıcı metin notu */}
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-4 mb-10">
            <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-200/90">
              {ui.notice}{" "}
              {/* Türkçe asıl metin öneksiz adreste */}
              <Link to={stripLang(pathname)} className="underline text-amber-300 hover:text-amber-200">
                {ui.viewTurkish}
              </Link>
            </p>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4">{doc.title}</h1>
            {doc.subtitle && (
              <h2 className="text-xl md:text-2xl font-semibold text-emerald-400">{doc.subtitle}</h2>
            )}
            {doc.intro && (
              <p className="text-zinc-400 max-w-2xl mx-auto mt-4">
                <RichText text={doc.intro} />
              </p>
            )}
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 md:p-10">
            {doc.sections.map((section) => (
              <section key={section.title} className="mb-10 last:mb-0">
                <h3 className="text-xl font-bold text-emerald-400 mb-4">{section.title}</h3>
                {section.blocks.map((block, i) => (
                  <Block key={i} block={block} />
                ))}
              </section>
            ))}

            {doc.footer && (
              <div className="mt-12 pt-8 border-t border-zinc-800">
                <p className="text-zinc-400 text-sm text-center">
                  {doc.footer.map((line, i) => (
                    <Fragment key={i}>
                      {i > 0 && <br />}
                      {line}
                    </Fragment>
                  ))}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalDocument;
