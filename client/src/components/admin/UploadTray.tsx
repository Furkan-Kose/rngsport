import { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Loader2, Upload, X, XCircle } from 'lucide-react';
import { dismissUpload, useUploadJobs, type UploadJob } from '../../lib/uploadQueue';

// Panelin her sayfasında sağ altta: süren / sıradaki / biten yüklemeler (lib/uploadQueue)
const JobRow = ({ job }: { job: UploadJob }) => {
  const active = job.status === 'queued' || job.status === 'running';
  const percent = job.total ? Math.round((job.done / job.total) * 100) : 0;
  return (
    <li className="px-4 py-3">
      <div className="flex items-center gap-2">
        {job.status === 'running' && <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />}
        {job.status === 'queued' && <Upload className="w-4 h-4 text-gray-500 shrink-0" />}
        {job.status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
        {job.status === 'error' && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
        <span className="text-sm text-white truncate flex-1" title={job.label}>
          {job.label}
        </span>
        {!active && (
          <button
            type="button"
            onClick={() => dismissUpload(job.id)}
            className="p-1 text-gray-500 hover:text-white"
            title="Kapat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {active ? (
        <>
          <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {job.status === 'queued' ? `Sırada · ${job.total} dosya` : `${job.done} / ${job.total}`}
          </p>
        </>
      ) : (
        <p className={`mt-1 text-xs ${job.status === 'done' ? 'text-emerald-300/90' : 'text-red-300/90'}`}>
          {job.uploaded} dosya yüklendi
          {job.failed.length > 0 &&
            ` · ${job.failed.length} yüklenemedi: ${job.failed.slice(0, 3).join(', ')}${job.failed.length > 3 ? '…' : ''}`}
          {job.error && ` · ${job.error}`}
        </p>
      )}
    </li>
  );
};

const UploadTray = () => {
  const jobs = useUploadJobs();
  const [collapsed, setCollapsed] = useState(false);
  if (jobs.length === 0) return null;

  const active = jobs.filter((j) => j.status === 'queued' || j.status === 'running');
  const running = active.find((j) => j.status === 'running');

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-gray-800/80 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-white">
          <Upload className="w-4 h-4 text-amber-400" />
          {active.length > 0
            ? running
              ? `Yükleniyor ${running.done}/${running.total}${active.length > 1 ? ` · ${active.length - 1} sırada` : ''}`
              : `${active.length} yükleme sırada`
            : 'Yüklemeler tamamlandı'}
        </span>
        {collapsed ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {!collapsed && (
        <>
          <ul className="max-h-72 overflow-y-auto divide-y divide-gray-800">
            {jobs.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </ul>
          {active.length > 0 && (
            <p className="px-4 py-2 text-[11px] text-gray-500 border-t border-gray-800">
              Panelde başka sayfaya geçebilirsiniz; sekmeyi kapatmayın.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default UploadTray;
