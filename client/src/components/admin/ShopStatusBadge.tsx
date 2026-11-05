import { SHOP_STATUS_CLASSES, SHOP_STATUS_LABELS, type ShopStatus } from '../../lib/shop';

const ShopStatusBadge = ({ status }: { status: ShopStatus }) => (
  <span
    className={`px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${SHOP_STATUS_CLASSES[status]}`}
  >
    {SHOP_STATUS_LABELS[status]}
  </span>
);

export default ShopStatusBadge;
