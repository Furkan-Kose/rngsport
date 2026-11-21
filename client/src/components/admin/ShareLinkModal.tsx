import { useState } from 'react';
import { toast } from 'react-toastify';
import { Copy, ExternalLink, Link2Off, MessageCircle } from 'lucide-react';
import api from '../../lib/api';
import { Button, IconButton, Modal } from './ui';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { inputClass } from '../../lib/adminUi';
import { formatDate } from '../../lib/adminFormat';
import { notifyError } from '../../lib/adminErrors';
import { whatsappShareUrl } from '../../lib/whatsapp';

export interface AdminShare {
  id: string;
  token: string;
  album: string | null;
  createdAt: string;
  expiresAt: string;
}

interface Props {
  userId: string;
  share: AdminShare;
  url: string;
  /** true: bu basışta yeni link açıldı; false: zaten açık olan link döndü */
  created: boolean;
  customerName: string | null;
  customerPhone?: string | null;
  onClose: () => void;
}

/**
 * Admin galeri sayfası "Link oluştur": müşterinin girişsiz paylaşım linki (/paylasim/:token).
 * Kopyala, WhatsApp'ta gönder (müşterinin numarası varsa doğrudan ona), linki kapat.
 */
const ShareLinkModal = ({ userId, share, url, created, customerName, customerPhone, onClose }: Props) => {
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link kopyalandı');
    } catch {
      toast.error('Kopyalanamadı — linki seçip elle kopyalayın');
    }
  };

  const message = `Merhaba${customerName ? ` ${customerName}` : ''}, ${
    share.album ? `"${share.album}" albümünüzdeki` : ''
  } fotoğraf ve videolarınızı bu bağlantıdan giriş yapmadan görüntüleyip indirebilirsiniz: ${url}`.replace(/ {2,}/g, ' ');

  const revoke = async () => {
    setRevoking(true);
    try {
      await api.delete(`/api/gallery/admin/user/${userId}/shares/${share.id}`);
      toast.success('Paylaşım linki kapatıldı');
      setConfirmRevoke(false);
      onClose();
    } catch (err) {
      notifyError(err, 'Link kapatılamadı');
    } finally {
      setRevoking(false);
    }
  };

  return (
    <>
      <Modal
        onClose={onClose}
        size="md"
        title="Galeri linki"
        description={`${share.album ? `"${share.album}" albümü` : 'Tüm galeri'} · ${formatDate(share.expiresAt)} tarihine kadar geçerli`}
        footer={
          <>
            <Button variant="ghost" icon={Link2Off} onClick={() => setConfirmRevoke(true)}>
              Linki kapat
            </Button>
            <Button icon={MessageCircle} href={whatsappShareUrl(message, customerPhone)} target="_blank">
              WhatsApp'ta gönder
            </Button>
            <Button variant="primary" icon={Copy} onClick={copy}>
              Kopyala
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              readOnly
              value={url}
              aria-label="Paylaşım linki"
              onFocus={(e) => e.currentTarget.select()}
              className={`${inputClass} font-mono text-xs`}
            />
            <IconButton icon={ExternalLink} href={url} target="_blank" title="Linki aç" />
          </div>
          <p className="text-sm text-gray-400">
            {created ? 'Yeni link oluşturuldu.' : 'Bu galeri için açık bir link zaten vardı; aynı link gösteriliyor.'}{' '}
            Linke sahip herkes giriş yapmadan görüntüleyip indirebilir. Müşteri de linki Galerim sayfasında
            "Paylaşım açık" olarak görür ve isterse kapatabilir.
          </p>
        </div>
      </Modal>

      <ConfirmDeleteModal
        open={confirmRevoke}
        title="Linki kapat"
        message="Bu link hemen çalışmaz olur; müşteriye ya da başkasına gönderdiyseniz açılmaz. Daha sonra yeni bir link oluşturabilirsiniz."
        confirmLabel="Linki kapat"
        busyLabel="Kapatılıyor…"
        isDeleting={revoking}
        onConfirm={revoke}
        onCancel={() => setConfirmRevoke(false)}
      />
    </>
  );
};

export default ShareLinkModal;
