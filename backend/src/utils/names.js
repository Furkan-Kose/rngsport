// Sporcu adını eşleşme için normalize et: küçük harf + TR karakter + tek boşluk
export const matchKey = (name) =>
  String(name ?? "")
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/i̇/g, "i")
    .replace(/\s+/g, " ")
    .trim();
