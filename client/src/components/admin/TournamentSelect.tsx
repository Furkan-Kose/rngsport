import { Trophy } from 'lucide-react';
import type { Tournament } from '../../lib/tournaments';
import { ALL_TOURNAMENTS } from '../../hooks/useAdminTournament';

// Admin yarışma seçicisi — durum useAdminTournament'ta (?t= adres çubuğunda)

interface Props {
  tournaments: Tournament[];
  value: string;
  onChange: (value: string) => void;
  /** "Tüm yarışmalar" seçeneği (Çekim Listesi'nde yok) */
  allowAll?: boolean;
  className?: string;
}

const TournamentSelect = ({ tournaments, value, onChange, allowAll = true, className = '' }: Props) => (
  <label className={`relative inline-flex items-center ${className}`}>
    <Trophy className="absolute left-3 w-4 h-4 text-amber-400 pointer-events-none" />
    <span className="sr-only">Yarışma</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full sm:w-auto max-w-full pl-9 pr-8 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 truncate"
    >
      {allowAll && <option value={ALL_TOURNAMENTS}>Tüm yarışmalar</option>}
      {tournaments.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
          {t.bookingOpen ? ' — rezervasyon açık' : ''}
        </option>
      ))}
    </select>
  </label>
);

export default TournamentSelect;
