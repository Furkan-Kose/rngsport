import { useState } from 'react';
import { Loader2, Mail, RotateCcw } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../lib/api';
import {
  DELIVERY_ICONS,
  DELIVERY_LABELS_TR,
  DELIVERY_SUBJECTS_TR,
  DELIVERY_TYPES,
  deliveryContents,
  type Deliveries,
  type DeliveryType,
} from '../../lib/delivery';

interface DeliveryRecord {
  id: string;
  athleteName: string;
  customerEmail: string | null;
  status: string;
  deliveries?: Deliveries;
  items: { packageId: string; category: string }[];
}

interface DeliveryPanelProps {
  kind: 'reservations' | 'orders';
  record: DeliveryRecord;
  onUpdated: (changes: { status: string; deliveries: Deliveries }) => void;
}

// Teslim edilemeyen durumlar (backend utils/delivery.js ile aynı)
const BLOCKED: Record<DeliveryPanelProps['kind'], string[]> = {
  reservations: ['CANCELLED'],
  orders: ['PENDING', 'FAILED', 'CANCELLED'],
};

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// Detay penceresindeki "Teslimat" bölümü: Fotoğraf · Video · Video Reels · Genel.
// Her parça kendi mailini BİR KEZ gönderir; tekrarı "Tekrar gönder" ile.
const DeliveryPanel = ({ kind, record, onUpdated }: DeliveryPanelProps) => {
  const [confirm, setConfirm] = useState<{ type: DeliveryType; resend: boolean } | null>(null);
  const [busy, setBusy] = useState<DeliveryType | null>(null);
  const done = record.deliveries ?? {};
  const has = deliveryContents(record.items);
  const relevant = (type: DeliveryType) => (type === 'general' ? false : has[type]);
  const blocked = BLOCKED[kind].includes(record.status);

  const send = async (type: DeliveryType, resend: boolean) => {
    setConfirm(null);
    setBusy(type);
    try {
      const res = await api.post(`/api/${kind}/${record.id}/deliver`, { type, resend });
      const updated = res.data.reservation ?? res.data.order;
      onUpdated({ status: updated.status, deliveries: updated.deliveries });
      toast.success(res.data.mailed ? `${DELIVERY_LABELS_TR[type]} teslim edildi, mail gönderildi` : 'Teslimat kaydedildi');
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(message || 'Teslimat kaydedilemedi');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="pt-4 border-t border-gray-700">
      <div className="flex items-center gap-2 mb-1">
        <Mail className="w-4 h-4 text-amber-400" />
        <h3 className="text-white font-medium">Teslimat</h3>
      </div>
      <p className="text-gray-500 text-xs mb-3">
        Hazır olan parçayı seçin; müşteriye ona uygun mail gider. Paketinde olanlar vurgulu.
      </p>

      {blocked ? (
        <p className="text-sm text-gray-400">Bu durumdaki kayıt teslim edilemez.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DELIVERY_TYPES.map((type) => {
            const when = done[type];
            return (
              <div
                key={type}
                className={`rounded-lg border p-2.5 flex flex-col gap-1.5 ${
                  when
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : relevant(type)
                    ? 'border-amber-500/50 bg-amber-500/5'
                    : 'border-gray-700 bg-gray-800/40'
                }`}
              >
                <span className="text-sm text-white font-medium">
                  {DELIVERY_ICONS[type]} {DELIVERY_LABELS_TR[type]}
                </span>
                {when ? (
                  <>
                    <span className="text-xs text-emerald-400">✓ {formatWhen(when)}</span>
                    <button
                      onClick={() => setConfirm({ type, resend: true })}
                      disabled={busy !== null || !record.customerEmail}
                      className="self-start inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white disabled:opacity-40"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Tekrar gönder
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirm({ type, resend: false })}
                    disabled={busy !== null}
                    className={`inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium disabled:opacity-50 ${
                      relevant(type)
                        ? 'bg-amber-500 hover:bg-amber-600 text-gray-900'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                    }`}
                  >
                    {busy === type && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Teslim et
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!record.customerEmail && !blocked && (
        <p className="text-xs text-gray-500 mt-2">Kayıtta e-posta yok; teslimat kaydedilir ama mail gitmez.</p>
      )}

      {confirm && (
        <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
          <p className="text-sm text-white">
            {record.customerEmail ? (
              <>
                <strong>{record.athleteName}</strong> için <strong>{record.customerEmail}</strong> adresine
                {' '}“{DELIVERY_SUBJECTS_TR[confirm.type]}” maili {confirm.resend ? 'tekrar ' : ''}gidecek.
              </>
            ) : (
              <>
                <strong>{record.athleteName}</strong>: {DELIVERY_LABELS_TR[confirm.type]} teslim edildi olarak işaretlenecek.
              </>
            )}
            {record.status !== 'DELIVERED' && ' Durum “Teslim Edildi” olur.'}
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setConfirm(null)}
              className="px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm"
            >
              Vazgeç
            </button>
            <button
              onClick={() => send(confirm.type, confirm.resend)}
              className="px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-gray-900 text-sm font-semibold"
            >
              {confirm.resend ? 'Tekrar gönder' : 'Teslim et ve gönder'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Liste satırında: gönderilmiş parçaların simgeleri (📸 🎬 🎞️ 📦)
export const DeliveryIcons = ({ deliveries }: { deliveries?: Deliveries }) => {
  const sent = DELIVERY_TYPES.filter((type) => deliveries?.[type]);
  if (sent.length === 0) return null;
  return (
    <span className="inline-flex gap-0.5 text-sm" title={sent.map((type) => `${DELIVERY_LABELS_TR[type]} gönderildi`).join(', ')}>
      {sent.map((type) => (
        <span key={type}>{DELIVERY_ICONS[type]}</span>
      ))}
    </span>
  );
};

export default DeliveryPanel;
