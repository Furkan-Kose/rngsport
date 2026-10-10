interface DiscountLineProps {
  subtotal: number | null;
  discountPercent: number;
  discountAmount: number;
  formatPrice: (value: number) => string;
}

// Admin detay pencerelerinde toplamın üstünde: ara toplam + sadakat indirimi.
// Sadakat sisteminden önceki kayıtlarda (indirim 0) hiçbir şey göstermez.
const DiscountLine = ({ subtotal, discountPercent, discountAmount, formatPrice }: DiscountLineProps) => {
  if (!discountPercent || subtotal == null) return null;
  return (
    <div className="mt-4 pt-4 border-t border-gray-700 space-y-1 text-sm">
      <div className="flex justify-between text-gray-400">
        <span>Ara toplam</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      <div className="flex justify-between text-amber-300">
        <span>Sadakat indirimi (%{discountPercent})</span>
        <span>−{formatPrice(discountAmount)}</span>
      </div>
    </div>
  );
};

export default DiscountLine;
