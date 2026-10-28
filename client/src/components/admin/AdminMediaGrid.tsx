import { Check, Loader2, Trash2 } from 'lucide-react';

export interface AdminMediaItem {
  id: string;
  fileName: string;
  url: string;
  thumbUrl?: string | null;
  contentType: string | null;
  album?: string | null;
}

const isVideo = (item: AdminMediaItem) => item.contentType?.startsWith('video/');

interface AdminMediaGridProps {
  items: AdminMediaItem[];
  deletingId: string | null;
  onDelete: (item: AdminMediaItem) => void;
  // Seçim modu (müşteri galerisinde taşı/sil): verilirse karoya tıklamak işaretler
  selectedIds?: Set<string>;
  onToggleSelect?: (item: AdminMediaItem) => void;
}

// Admin galerilerinin silme butonlu foto/video ızgarası
const AdminMediaGrid = ({ items, deletingId, onDelete, selectedIds, onToggleSelect }: AdminMediaGridProps) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
    {items.map((item) => {
      const selected = !!selectedIds?.has(item.id);
      return (
        <div
          key={item.id}
          onClick={onToggleSelect ? () => onToggleSelect(item) : undefined}
          className={`relative group aspect-square rounded-xl overflow-hidden bg-gray-800 border ${
            selected ? 'border-amber-400 ring-2 ring-amber-400' : 'border-gray-700'
          } ${onToggleSelect ? 'cursor-pointer select-none' : ''}`}
        >
          {isVideo(item) && !item.thumbUrl ? (
            <video src={item.url} preload="metadata" muted className="w-full h-full object-cover" />
          ) : (
            <img src={item.thumbUrl || item.url} alt={item.fileName} loading="lazy" className="w-full h-full object-cover" />
          )}
          {isVideo(item) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-linear-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-xs text-white truncate">{item.fileName}</p>
            {item.album && <p className="text-xs text-amber-400 truncate">{item.album}</p>}
          </div>
          {onToggleSelect && (
            <div
              className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selected ? 'bg-amber-500 border-amber-500' : 'bg-black/40 border-white/70'
              }`}
            >
              {selected && <Check className="w-4 h-4 text-white" />}
            </div>
          )}
          {!onToggleSelect && (
            <button
              onClick={() => onDelete(item)}
              disabled={deletingId === item.id}
              className="absolute top-2 right-2 p-2 rounded-lg bg-black/60 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 hover:bg-red-600/80 transition-all duration-300"
              title="Sil"
            >
              {deletingId === item.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      );
    })}
  </div>
);

export default AdminMediaGrid;
