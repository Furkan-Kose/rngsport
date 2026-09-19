import { Loader2, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  title: string;
  /** Neyin kalıcı olarak gideceğini açıkça yaz — bu işlem geri alınamaz */
  message: ReactNode;
  isDeleting?: boolean;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Yıkıcı işlemler için ağır onay modalı.
 * z-60: bir detay modalının (z-50) üstünde de açılabilsin diye.
 */
const ConfirmDeleteModal = ({
  open,
  title,
  message,
  isDeleting = false,
  confirmLabel = 'Evet, Sil',
  onConfirm,
  onCancel,
}: Props) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-60">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md p-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
          <div className="text-gray-400 mb-6 text-sm leading-relaxed">{message}</div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
