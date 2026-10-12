interface PriorityCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  fee: number; // seri başına ek ücret
  className?: string;
}

// Rezervasyon formu ve sepetteki "Öncelikli" seçeneği + ne işe yaradığına dair kısa açıklama
const PriorityCheckbox = ({ checked, onChange, fee, className = "" }: PriorityCheckboxProps) => (
  <label
    className={`flex items-start gap-2.5 cursor-pointer select-none rounded-xl border px-3 py-2.5 transition-colors ${
      checked
        ? "bg-amber-500/10 border-amber-500/40"
        : "bg-zinc-900/40 border-zinc-700/60 hover:border-amber-500/30"
    } ${className}`}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 w-4 h-4 shrink-0 rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 cursor-pointer"
    />
    <span className="text-sm">
      <span className="text-zinc-200">
        ⚡ <strong className="text-amber-300">Öncelikli teslim</strong>{" "}
        <span className="text-zinc-500">(+₺{fee.toLocaleString("tr-TR")} / seri)</span>
      </span>
      <span className="block text-xs text-zinc-500 mt-0.5">
        Çekimleriniz öncelikli olarak düzenlenir ve 7 gün içinde teslim edilir.
      </span>
    </span>
  </label>
);

export default PriorityCheckbox;
