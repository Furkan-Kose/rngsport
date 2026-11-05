import { useState, type ComponentType } from 'react';
import { CheckCircle2, CircleSlash, Clock, PackageCheck, Wallet, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../lib/api';
import { refreshAdminBadges } from '../../hooks/useAdminBadges';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { Button } from './ui';
import type { ButtonVariant } from '../../lib/adminUi';

/**
 * Toplu durum değiştirme çubuğu + onay penceresi (Paket Siparişleri / Rezervasyonlar).
 * Onaydan önce sunucudan kaç kaydın değişeceği ve "Teslim Edildi"de kaç kişiye mail
 * gideceği alınır (`/bulk-status/preview`). Yan etkiler tekil güncellemeyle aynıdır.
 */

type Kind = 'order' | 'reservation';

interface StatusOption {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  variant: ButtonVariant;
}

const OPTIONS: Record<Kind, StatusOption[]> = {
  reservation: [
    { key: 'PENDING', label: 'Bekliyor', icon: Clock, variant: 'secondary' },
    { key: 'CONFIRMED', label: 'Onaylandı', icon: CheckCircle2, variant: 'soft' },
    { key: 'PAID', label: 'Ödendi', icon: Wallet, variant: 'primary' },
    { key: 'DELIVERED', label: 'Teslim Edildi', icon: PackageCheck, variant: 'soft' },
    { key: 'CANCELLED', label: 'İptal', icon: XCircle, variant: 'danger' },
  ],
  order: [
    { key: 'PENDING', label: 'Bekliyor', icon: Clock, variant: 'secondary' },
    { key: 'PAID', label: 'Ödendi', icon: Wallet, variant: 'primary' },
    { key: 'DELIVERED', label: 'Teslim Edildi', icon: PackageCheck, variant: 'soft' },
    { key: 'FAILED', label: 'Başarısız', icon: CircleSlash, variant: 'secondary' },
    { key: 'CANCELLED', label: 'İptal', icon: XCircle, variant: 'danger' },
  ],
};

const ENDPOINT: Record<Kind, string> = { order: '/api/orders', reservation: '/api/reservations' };

interface Preview {
  changing: number;
  unchanged: number;
  willMail: number;
}

const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback;

const BulkStatusBar = ({
  kind,
  selectedIds,
  names,
  onDone,
}: {
  kind: Kind;
  selectedIds: Set<string>;
  /** Onay penceresinde gösterilecek isimler (görünen sayfadaki seçililer) */
  names: string[];
  onDone: () => void;
}) => {
  const [target, setTarget] = useState<StatusOption | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const count = selectedIds.size;

  const open = async (option: StatusOption) => {
    setTarget(option);
    setPreview(null);
    try {
      const { data } = await api.post(`${ENDPOINT[kind]}/bulk-status/preview`, { ids: [...selectedIds], status: option.key });
      setPreview(data);
    } catch {
      /* önizleme olmadan da onaylanabilir */
    }
  };

  const run = async () => {
    if (!target) return;
    setBusy(true);
    try {
      const { data } = await api.post(`${ENDPOINT[kind]}/bulk-status`, { ids: [...selectedIds], status: target.key });
      const parts = [`${data.updated} kayıt "${target.label}" yapıldı`];
      if (data.skipped) parts.push(`${data.skipped} zaten bu durumdaydı`);
      if (data.mailed) parts.push(`${data.mailed} kişiye teslim maili gönderildi`);
      if (data.failed?.length) parts.push(`${data.failed.length} güncellenemedi`);
      (data.failed?.length ? toast.warn : toast.success)(parts.join(' · '));
      setTarget(null);
      refreshAdminBadges();
      onDone();
    } catch (err) {
      toast.error(errorMessage(err, 'Toplu güncelleme yapılamadı'));
    } finally {
      setBusy(false);
    }
  };

  if (count === 0 && !target) return null;

  const isCancel = target?.key === 'CANCELLED';
  const recordWord = kind === 'order' ? 'paket siparişi' : 'rezervasyon';

  return (
    <>
      {count > 0 && (
        // Alt ortada: sağ alttaki yükleme kutusuyla (UploadTray) çakışmasın
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 bg-gray-800/95 backdrop-blur border border-amber-500/40 rounded-2xl shadow-2xl px-4 py-3">
            <span className="text-sm text-white font-semibold mr-auto">
              {count} seçili <span className="text-gray-400 font-normal">· durumu yap:</span>
            </span>
            {OPTIONS[kind].map((option) => (
              <Button key={option.key} size="sm" variant={option.variant} icon={option.icon} onClick={() => open(option)}>
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={!!target}
        tone={isCancel ? 'danger' : 'confirm'}
        title={
          isCancel ? `${count} ${recordWord} iptal edilsin mi?` : `${count} ${recordWord} "${target?.label}" yapılsın mı?`
        }
        message={
          <>
            <span className="block mb-2 text-gray-300">
              {names.slice(0, 6).join(', ')}
              {count > Math.min(names.length, 6) && ` ve ${count - Math.min(names.length, 6)} kayıt daha`}
            </span>
            {preview && (
              <span className="block mb-2">
                <strong className="text-white">{preview.changing}</strong> kayıt değişecek
                {preview.unchanged > 0 && `, ${preview.unchanged} kayıt zaten bu durumda (atlanır)`}.
              </span>
            )}
            {target?.key === 'PAID' && 'Ödendi yapılınca sadakat puanları müşterilere yazılır. '}
            {target?.key === 'DELIVERED' && (
              <span className="block text-amber-300">
                {preview
                  ? preview.willMail > 0
                    ? `${preview.willMail} kişiye "dosyalarınız hazır" teslim maili gidecek (daha önce teslim maili almamış olanlar). `
                    : 'Seçilenlerin hepsi daha önce teslim maili almış — yeni mail gitmez. '
                  : 'Daha önce teslim maili almamış olanlara "dosyalarınız hazır" maili gider. '}
                Teslim edilenler de puan kazanır.
              </span>
            )}
            {isCancel && 'Ödenmiş kayıtların puanları geri alınır, harcanan puanlar iade edilir. Müşteriye mail gitmez. '}
            {(target?.key === 'PENDING' || target?.key === 'CONFIRMED' || target?.key === 'FAILED') &&
              'Müşteriye mail gönderilmez. '}
          </>
        }
        confirmLabel={isCancel ? 'Evet, İptal Et' : 'Evet, Uygula'}
        busyLabel="Güncelleniyor..."
        isDeleting={busy}
        onConfirm={run}
        onCancel={() => setTarget(null)}
      />
    </>
  );
};

export default BulkStatusBar;
