import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Download, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import { formatFileSize } from '../../lib/media';

// Müşterinin galeri indirme geçmişi (admin). Kayıt "indirme başladı" demektir:
// dosyalar doğrudan R2'den indiği için bitip bitmediği bilinmez.
interface DownloadRow {
  id: string;
  shareId: string | null;
  kind: 'single' | 'save' | 'zip' | 'server-zip';
  selected: boolean;
  album: string | null;
  fileName: string | null;
  fileCount: number;
  totalSize: number | null;
  quality: 'original' | 'preview';
  createdAt: string;
}

interface Summary {
  total: number;
  viaShare: number;
  lastDownloadAt: string | null;
}

// Aynı gün yapılan tek dosya / galeriye kaydet indirmeleri tek satırda toplanır
interface Line {
  key: string;
  createdAt: string;
  label: string;
  album: string | null;
  fileName: string | null;
  fileCount: number;
  totalSize: number;
  preview: boolean;
  viaShare: boolean;
  count: number;
}

const dayKey = (iso: string) => new Date(iso).toLocaleDateString('tr-TR');

const labelFor = (row: DownloadRow) => {
  if (row.kind === 'save') return 'Galeriye kaydedildi (telefon)';
  if (row.kind === 'single') return 'Tek dosya';
  if (row.selected) return 'Seçilenler – zip';
  return row.album ? 'Albüm – zip' : 'Tümü – zip';
};

const groupRows = (rows: DownloadRow[]): Line[] => {
  const lines: Line[] = [];
  const singles = new Map<string, Line>();
  for (const row of rows) {
    const preview = row.quality === 'preview';
    const viaShare = !!row.shareId;
    const base = {
      createdAt: row.createdAt,
      label: labelFor(row),
      album: row.album,
      fileName: row.fileName,
      fileCount: row.fileCount,
      totalSize: row.totalSize ?? 0,
      preview,
      viaShare,
      count: 1,
    };
    if (row.kind !== 'single' && row.kind !== 'save') {
      lines.push({ key: row.id, ...base });
      continue;
    }
    // Satırlar yeniden eskiye geliyor: grubun tarihi gündeki en son indirme olur
    const key = `${dayKey(row.createdAt)}|${row.kind}|${viaShare}|${preview}`;
    const group = singles.get(key);
    if (group) {
      group.count += 1;
      group.fileCount += row.fileCount;
      group.totalSize += row.totalSize ?? 0;
      if (group.album !== row.album) group.album = null;
      continue;
    }
    const line = { key, ...base };
    singles.set(key, line);
    lines.push(line);
  }
  return lines;
};

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));

const DownloadHistory = ({ userId }: { userId: string }) => {
  const [rows, setRows] = useState<DownloadRow[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .get(`/api/gallery/admin/user/${userId}/downloads`)
      .then(({ data }) => {
        if (!alive) return;
        setRows(data.data);
        setSummary(data.summary);
      })
      .catch(() => alive && setRows([]));
    return () => {
      alive = false;
    };
  }, [userId]);

  const lines = useMemo(() => groupRows(rows ?? []), [rows]);

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-2xl mb-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="flex items-center gap-2 text-white font-medium">
          <Download className="w-4 h-4 text-amber-400" />
          İndirme geçmişi
        </span>
        <span className="flex items-center gap-3 text-sm text-gray-400">
          {rows === null ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : summary?.lastDownloadAt ? (
            <span>
              Son: {formatDateTime(summary.lastDownloadAt)}
              {summary.viaShare > 0 && ` · paylaşım linkinden ${summary.viaShare}`}
            </span>
          ) : (
            <span className="text-red-400/80">Henüz indirmedi</span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && rows !== null && (
        <div className="border-t border-gray-700 px-5 py-4">
          {lines.length === 0 ? (
            <p className="text-sm text-gray-400">Bu müşteri henüz bir şey indirmedi.</p>
          ) : (
            <ul className="divide-y divide-gray-700/60">
              {lines.map((line) => (
                <li key={line.key} className="py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="text-gray-400 tabular-nums w-36 shrink-0">{formatDateTime(line.createdAt)}</span>
                  <span className="text-white font-medium">
                    {line.label}
                    {line.count > 1 && ` × ${line.count}`}
                  </span>
                  {line.count === 1 && line.fileName && (
                    <span className="text-gray-400 truncate max-w-56">{line.fileName}</span>
                  )}
                  {line.album && <span className="text-gray-400">{line.album}</span>}
                  <span className="text-gray-500">
                    {line.fileCount} dosya{line.totalSize > 0 && ` · ${formatFileSize(line.totalSize)}`}
                  </span>
                  {line.preview && (
                    <span className="px-1.5 py-0.5 text-[11px] rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-300">
                      Küçük boyut
                    </span>
                  )}
                  {line.viaShare && (
                    <span className="px-1.5 py-0.5 text-[11px] rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300">
                      Paylaşım linkinden
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-gray-500 mt-3">
            Kayıt, indirmenin başladığını gösterir. Dosyalar doğrudan depodan indiği için bitip bitmediği
            görülmez. {summary && summary.total > 200 && 'Son 200 kayıt gösteriliyor.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default DownloadHistory;
