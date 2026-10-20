// Çekim listesiyle isim + alet eşleşmesi (admin listeleri). Sunucu her satıra ekler;
// bkz. backend utils/names.js shootingListChecker.
//   full: isim ve bütün aletler listede · partial: isim var, alet uyuşmuyor
//   none: isim yok · null: henüz liste yüklenmemiş
export type ListMatch = 'full' | 'partial' | 'none' | null;

export interface ListMatchFields {
  listMatch?: ListMatch;
  unmatchedApparatuses?: string[];
}

export const listMatchTint = (match: ListMatch | undefined) =>
  match === 'full'
    ? 'bg-green-500/5'
    : match === 'partial'
      ? 'bg-amber-500/10'
      : match === 'none'
        ? 'bg-red-500/10'
        : '';
