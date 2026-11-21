import { STATUS_BADGE_CLASSES as BADGE_CLASSES, STATUS_LABELS } from './orderStatusMeta';

/**
 * Sipariş ve rezervasyon durum rozeti (renk ve adlar: lib/orderStatusMeta.ts).
 * İki enum'un birleşimi: Order (PENDING/PAID/FAILED/CANCELLED/DELIVERED) ve
 * Reservation (PENDING/CONFIRMED/PAID/CANCELLED/DELIVERED).
 */
const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={`px-2 py-1 text-xs font-medium rounded-full border whitespace-nowrap ${
      BADGE_CLASSES[status] || BADGE_CLASSES.PENDING
    }`}
  >
    {STATUS_LABELS[status] || status}
  </span>
);

export default StatusBadge;
