/**
 * Sipariş ve rezervasyon durum rozeti — admin panelinin tek kaynağı.
 * İki enum'un birleşimi: Order (PENDING/PAID/FAILED/CANCELLED/DELIVERED) ve
 * Reservation (PENDING/CONFIRMED/PAID/CANCELLED/DELIVERED).
 */
const BADGE_CLASSES: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  CONFIRMED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PAID: 'bg-green-500/20 text-green-400 border-green-500/30',
  FAILED: 'bg-red-500/20 text-red-400 border-red-500/30',
  CANCELLED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  DELIVERED: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Bekliyor',
  CONFIRMED: 'Onaylandı',
  PAID: 'Ödendi',
  FAILED: 'Başarısız',
  CANCELLED: 'İptal',
  DELIVERED: 'Teslim Edildi',
};

const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={`px-2 py-1 text-xs font-medium rounded-full border ${
      BADGE_CLASSES[status] || BADGE_CLASSES.PENDING
    }`}
  >
    {STATUS_LABELS[status] || status}
  </span>
);

export default StatusBadge;
