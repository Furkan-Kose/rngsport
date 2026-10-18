import { useState } from 'react';
import { Languages } from 'lucide-react';

// Panelden girilen içeriğin EN/RU çevirileri. Türkçe asıl alanlar formun kendisinde;
// burada boş bırakılan alan sitede Türkçe görünür (sunucu: utils/i18n.js localize).
export type TranslationLang = 'en' | 'ru';
export type Translations = Partial<Record<TranslationLang, Record<string, string | string[]>>>;

export interface TranslationField {
  key: string;
  label: string;
  /** Çok satırlı metin */
  multiline?: boolean;
  /** Satır başına bir öğe (ör. paket özellikleri) — dizi olarak saklanır */
  list?: boolean;
  /** Türkçe değer — yer tutucu olarak gösterilir, neyin çevrileceği görünsün */
  source?: string | string[];
}

const LANG_LABELS: Record<TranslationLang, string> = { en: 'İngilizce', ru: 'Rusça' };

const inputClass =
  'w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-amber-500';

interface Props {
  fields: TranslationField[];
  value: Translations;
  onChange: (next: Translations) => void;
}

const TranslationFields = ({ fields, value, onChange }: Props) => {
  const [lang, setLang] = useState<TranslationLang>('en');
  const current = value[lang] ?? {};

  const setField = (key: string, fieldValue: string | string[]) =>
    onChange({ ...value, [lang]: { ...current, [key]: fieldValue } });

  // Sekmede kaç alan dolu — hangi dilin eksik olduğu bir bakışta görünsün
  const filledCount = (l: TranslationLang) =>
    fields.filter((f) => {
      const v = value[l]?.[f.key];
      return Array.isArray(v) ? v.some((x) => x.trim()) : !!v?.trim();
    }).length;

  return (
    <div className="p-4 bg-sky-500/5 border border-sky-500/20 rounded-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="flex items-center gap-2 text-sm font-medium text-sky-300">
          <Languages className="w-4 h-4" />
          Çeviriler
        </h3>
        <div className="flex gap-1">
          {(Object.keys(LANG_LABELS) as TranslationLang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                lang === l
                  ? 'bg-sky-500/20 border-sky-500/50 text-sky-200'
                  : 'bg-gray-700/40 border-gray-600 text-gray-400 hover:text-gray-200'
              }`}
            >
              {l.toUpperCase()} · {filledCount(l)}/{fields.length}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        {LANG_LABELS[lang]} sitede gösterilecek metinler. Boş bırakılan alan Türkçe görünür.
      </p>

      <div className="space-y-3">
        {fields.map((field) => {
          const raw = current[field.key];
          const placeholder = Array.isArray(field.source)
            ? field.source.join('\n')
            : field.source || '';
          return (
            <div key={field.key}>
              <label className="block text-xs text-gray-400 mb-1">{field.label}</label>
              {field.list ? (
                <textarea
                  rows={Math.max(3, Array.isArray(field.source) ? field.source.length : 3)}
                  value={Array.isArray(raw) ? raw.join('\n') : raw ?? ''}
                  onChange={(e) => setField(field.key, e.target.value.split('\n'))}
                  placeholder={placeholder}
                  className={`${inputClass} resize-y`}
                />
              ) : field.multiline ? (
                <textarea
                  rows={3}
                  value={typeof raw === 'string' ? raw : ''}
                  onChange={(e) => setField(field.key, e.target.value)}
                  placeholder={placeholder}
                  className={`${inputClass} resize-y`}
                />
              ) : (
                <input
                  type="text"
                  value={typeof raw === 'string' ? raw : ''}
                  onChange={(e) => setField(field.key, e.target.value)}
                  placeholder={placeholder}
                  className={inputClass}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TranslationFields;
