/**
 * Paket siparişi ve rezervasyon durumlarının rengi ve adı — admin panelinin tek kaynağı.
 * Rozet (lib/orderStatus.tsx) ve ana sayfadaki "Durumlar" kartı buradan okur.
 */
export const STATUS_BADGE_CLASSES: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  CONFIRMED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PAID: 'bg-green-500/20 text-green-400 border-green-500/30',
  FAILED: 'bg-red-500/20 text-red-400 border-red-500/30',
  CANCELLED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  DELIVERED: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Bekliyor',
  CONFIRMED: 'Onaylandı',
  PAID: 'Ödendi',
  FAILED: 'Başarısız',
  CANCELLED: 'İptal',
  DELIVERED: 'Teslim Edildi',
};
