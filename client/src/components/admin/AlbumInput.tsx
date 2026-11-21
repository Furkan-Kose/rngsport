import { useId } from 'react';
import { useTournaments } from '../../lib/tournaments';

// Yarışma / albüm adı: yazarken mevcut albümler ve son yarışmalar öneri olarak çıkar
// (tarayıcının datalist'i). Yine de yeni ad yazılabilir.
interface AlbumInputProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  disabled?: boolean;
  autoFocus?: boolean;
}

const AlbumInput = ({ value, onChange, options, disabled, autoFocus }: AlbumInputProps) => {
  const listId = useId();
  // Yarışma adları da önerilir (mevcut albümlerden sonra; aynı ad tekrar edilmez, büyük/küçük harf fark etmez)
  const { tournaments } = useTournaments();
  const seen = new Set(options.map((o) => o.toLocaleLowerCase('tr')));
  const all = [
    ...options,
    ...tournaments.map((t) => t.name).filter((n) => !seen.has(n.toLocaleLowerCase('tr'))),
  ];
  return (
    <>
      <input
        type="text"
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Listeden seçin veya yeni yarışma adı yazın"
        maxLength={100}
        disabled={disabled}
        autoFocus={autoFocus}
        className="w-full bg-gray-900/50 border rounded-lg text-white placeholder:text-gray-500 transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-10 px-3 py-2 text-sm border-gray-700 focus:border-amber-500 focus:ring-amber-500/25"
      />
      <datalist id={listId}>
        {all.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
    </>
  );
};

export default AlbumInput;
