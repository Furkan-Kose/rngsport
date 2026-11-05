import { useEffect, useMemo, useState } from 'react';
import { Download, FileSpreadsheet, X } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../lib/api';
import { Button } from './ui';

/**
 * Excel indirme penceresi: sütun seçimi + filtreler.
 * Sütun listesi backend'den gelir (`…/export/columns`), seçim tarayıcıda sayfa başına hatırlanır.
 * Paket Siparişleri, Rezervasyonlar ve Çekim Listesi aynı pencereyi kullanır.
 */

export interface ExportColumn {
  key: string;
  label: string;
  group?: string;
}

export type ExportField =
  | { key: string; label: string; type: 'select'; options: { value: string; label: string }[] }
  | { key: string; label: string; type: 'text'; placeholder?: string }
  | { key: string; label: string; type: 'date' }
  | { key: string; label: string; type: 'checkbox'; hint?: string };

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  columnsUrl: string;
  exportUrl: string;
  /** localStorage anahtarı (sütun seçimi hatırlanır) */
  storageKey: string;
  fields: ExportField[];
  /** Filtrelerin başlangıç değerleri (sayfadaki sekme/arama ile doldurulur) */
  initialValues: Record<string, string>;
  /** Her zaman gönderilen, kullanıcının değiştirmediği parametreler (ör. dayId) */
  fixedParams?: Record<string, string>;
  fallbackFileName: string;
}

const readStored = (key: string): string[] | null => {
  try {
    const raw = localStorage.getItem(`export-cols:${key}`);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const writeStored = (key: string, cols: string[]) => {
  try {
    localStorage.setItem(`export-cols:${key}`, JSON.stringify(cols));
  } catch {
    /* gizli sekme vb. — seçim bu sefer hatırlanmaz */
  }
};

const fileNameFrom = (header: string | undefined, fallback: string) => {
  const match = header?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match ? decodeURIComponent(match[1]) : fallback;
};

const inputClass =
  'w-full h-10 px-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-amber-500';

const ExportModal = ({
  open,
  onClose,
  title,
  columnsUrl,
  exportUrl,
  storageKey,
  fields,
  initialValues,
  fixedParams,
  fallbackFileName,
}: Props) => {
  const [columns, setColumns] = useState<ExportColumn[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [downloading, setDownloading] = useState(false);

  // Her açılışta filtreler sayfanın o anki haliyle başlar
  useEffect(() => {
    if (open) setValues(initialValues);
    // initialValues her render'da yeni nesne; yalnızca açılışta okunur
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || columns) return;
    api
      .get(columnsUrl)
      .then(({ data }) => {
        const list: ExportColumn[] = data.columns;
        setColumns(list);
        const stored = readStored(storageKey)?.filter((k) => list.some((c) => c.key === k));
        setSelected(new Set(stored?.length ? stored : list.map((c) => c.key)));
      })
      .catch(() => toast.error('Sütun listesi alınamadı'));
  }, [open, columns, columnsUrl, storageKey]);

  const groups = useMemo(() => {
    const map = new Map<string, ExportColumn[]>();
    for (const col of columns ?? []) {
      const g = col.group ?? 'Sütunlar';
      map.set(g, [...(map.get(g) ?? []), col]);
    }
    return [...map.entries()];
  }, [columns]);

  if (!open) return null;

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleGroup = (cols: ExportColumn[]) =>
    setSelected((prev) => {
      const next = new Set(prev);
      const allOn = cols.every((c) => next.has(c.key));
      for (const c of cols) {
        if (allOn) next.delete(c.key);
        else next.add(c.key);
      }
      return next;
    });

  const download = async () => {
    if (!columns || selected.size === 0) return;
    setDownloading(true);
    const ordered = columns.filter((c) => selected.has(c.key)).map((c) => c.key);
    writeStored(storageKey, ordered);
    try {
      const params: Record<string, string> = { ...fixedParams, columns: ordered.join(',') };
      for (const [k, v] of Object.entries(values)) if (v !== '' && v !== undefined) params[k] = v;
      const response = await api.get(exportUrl, { params, responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileNameFrom(response.headers['content-disposition'], fallbackFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Excel indirildi');
      onClose();
    } catch (err) {
      // Hata cevabı da blob olarak gelir; mesajı okumaya çalış
      let message = 'Excel indirilemedi';
      const data = (err as { response?: { data?: Blob } }).response?.data;
      if (data instanceof Blob) {
        try {
          message = JSON.parse(await data.text()).message || message;
        } catch {
          /* yoksay */
        }
      }
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl my-4 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            {title}
          </h2>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-white" aria-label="Kapat">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6 overflow-y-auto">
          {/* Filtreler */}
          <section>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Filtre</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {fields.map((field) => {
                const value = values[field.key] ?? '';
                const set = (v: string) => setValues((prev) => ({ ...prev, [field.key]: v }));
                if (field.type === 'checkbox') {
                  return (
                    <label key={field.key} className="sm:col-span-2 flex items-start gap-2 text-sm text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value === '1'}
                        onChange={(e) => set(e.target.checked ? '1' : '')}
                        className="mt-0.5 accent-amber-500"
                      />
                      <span>
                        {field.label}
                        {field.hint && <span className="block text-xs text-gray-500">{field.hint}</span>}
                      </span>
                    </label>
                  );
                }
                return (
                  <label key={field.key} className="block">
                    <span className="block text-xs text-gray-400 mb-1">{field.label}</span>
                    {field.type === 'select' ? (
                      <select value={value} onChange={(e) => set(e.target.value)} className={inputClass}>
                        {field.options.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={value}
                        onChange={(e) => set(e.target.value)}
                        placeholder={field.type === 'text' ? field.placeholder : undefined}
                        className={inputClass}
                      />
                    )}
                  </label>
                );
              })}
            </div>
          </section>

          {/* Sütunlar */}
          <section>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="text-sm font-semibold text-gray-300">
                Sütunlar{' '}
                {columns && (
                  <span className="text-gray-500 font-normal">
                    ({selected.size}/{columns.length})
                  </span>
                )}
              </h3>
              {columns && (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setSelected(new Set(columns.map((c) => c.key)))}>
                    Tümünü seç
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                    Temizle
                  </Button>
                </div>
              )}
            </div>
            {!columns ? (
              <div className="h-24 rounded-lg bg-gray-700/40 animate-pulse" />
            ) : (
              <div className="space-y-4">
                {groups.map(([group, cols]) => (
                  <div key={group}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(cols)}
                      className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-300 mb-1.5"
                      title="Bu gruptakilerin hepsini seç / kaldır"
                    >
                      {group}
                    </button>
                    <div className="flex flex-wrap gap-2">
                      {cols.map((col) => {
                        const on = selected.has(col.key);
                        return (
                          <button
                            key={col.key}
                            type="button"
                            onClick={() => toggle(col.key)}
                            aria-pressed={on}
                            className={`h-8 px-3 rounded-lg text-sm border transition-colors ${
                              on
                                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                                : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:text-gray-200'
                            }`}
                          >
                            {on ? '✓ ' : ''}
                            {col.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-700">
          {selected.size === 0 && columns && <p className="text-xs text-red-400 mr-auto">En az bir sütun seçin</p>}
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button variant="primary" icon={Download} loading={downloading} disabled={!columns || selected.size === 0} onClick={download}>
            Excel İndir
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
