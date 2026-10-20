import { getApparatusLabel } from '../../constants/apparatuses';
import type { ListMatch } from '../../lib/listMatch';

// Admin sipariş/rezervasyon listelerinde "çekim listesinde mi?" açıklaması ve uyarısı.
// Kural çekim listesiyle aynı: isim + alet (bkz. backend utils/names.js shootingListChecker).

export const ListMatchLegend = ({ scope }: { scope: string }) => (
  <div className="px-4 py-2.5 border-b border-gray-700/50 flex items-center gap-4 text-xs text-gray-400 flex-wrap">
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-3 h-3 rounded-sm bg-green-500/30 border border-green-500/40" />
      Çekim listesinde (isim + alet)
    </span>
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-3 h-3 rounded-sm bg-amber-500/30 border border-amber-500/40" />
      İsim var, alet uyuşmuyor
    </span>
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-3 h-3 rounded-sm bg-red-500/30 border border-red-500/40" />
      Listede bulunamadı (isim hatalı olabilir)
    </span>
    <span className="text-gray-500">— yalnızca {scope} için</span>
  </div>
);

/** Detay penceresinde: neden çekilmeyeceğini ve neyin düzeltileceğini söyler */
export const ListMatchWarning = ({
  listMatch,
  unmatchedApparatuses = [],
}: {
  listMatch?: ListMatch;
  unmatchedApparatuses?: string[];
}) => {
  if (listMatch !== 'partial' && listMatch !== 'none') return null;
  const isNone = listMatch === 'none';
  return (
    <div
      className={`flex items-start gap-2 p-3 rounded-lg text-sm border ${
        isNone ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
      }`}
    >
      <span aria-hidden>⚠️</span>
      <span>
        {isNone ? (
          <>Bu sporcu çekim listesinde bulunamadı; adı listeyle karşılaştırıp düzeltin.</>
        ) : unmatchedApparatuses.length > 0 ? (
          <>
            Sporcu listede var ama şu alet{unmatchedApparatuses.length > 1 ? 'ler' : ''} listedeki çıkışlarıyla
            eşleşmiyor: <strong>{unmatchedApparatuses.map(getApparatusLabel).join(', ')}</strong>. Bu çıkış çekilmeyecek
            görünür; aleti listeyle karşılaştırıp düzeltin.
          </>
        ) : (
          <>Sporcu listede var ama kayıtta alet seçilmemiş; çıkışları çekilmeyecek görünür. Aletleri seçin.</>
        )}
      </span>
    </div>
  );
};
