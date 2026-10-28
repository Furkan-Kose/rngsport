// Yazım farkı ("Ankara kupası " ↔ "Ankara Kupası") ayrı albüm açmasın: büyük/küçük harf ve
// boşluk farkı yoksayılarak mevcut adın yazımı kullanılır.
export const canonicalAlbum = (value: string, options: string[]) => {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  const key = trimmed.toLocaleLowerCase('tr');
  return options.find((o) => o.trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr') === key) ?? trimmed;
};
