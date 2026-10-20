import prisma from "../lib/prisma.js";
import { normalizeApparatus } from "./apparatuses.js";

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

// Admin listelerindeki "çekim listesinde mi?" renklendirmesi. Çekim listesiyle aynı
// kural: bir çıkış, aynı isim + o aletle eşleşir (bkz. shootingList.controller
// computeMatch). Listeyi bir kez okur ve kayıt başına sonuç dönen bir fonksiyon verir:
//   listMatch "full"    → isim var, kayıttaki bütün aletler listede
//             "partial" → isim var ama bazı aletler listede yok (ya da hiç alet seçilmemiş)
//             "none"    → isim listede yok (büyük olasılıkla yanlış yazılmış)
//             null      → henüz liste yüklenmemiş
//   unmatchedApparatuses → listede karşılığı olmayan alet slug'ları
export const shootingListChecker = async () => {
  const entries = await prisma.shootingListEntry.findMany({
    select: { athleteName: true, category: true },
  });
  const byName = new Map(); // nameKey → Set(alet slug)
  for (const e of entries) {
    const key = matchKey(e.athleteName);
    if (!byName.has(key)) byName.set(key, new Set());
    const app = normalizeApparatus(e.category);
    if (app) byName.get(key).add(app);
  }

  return (record) => {
    if (byName.size === 0) return { listMatch: null, unmatchedApparatuses: [] };
    const listed = byName.get(matchKey(record.athleteName));
    if (!listed) return { listMatch: "none", unmatchedApparatuses: [] };
    const apparatuses = [
      ...new Set(
        (record.items ?? []).flatMap((it) => (it.apparatuses ?? []).map(normalizeApparatus).filter(Boolean))
      ),
    ];
    const unmatched = apparatuses.filter((a) => !listed.has(a));
    return {
      listMatch: apparatuses.length > 0 && unmatched.length === 0 ? "full" : "partial",
      unmatchedApparatuses: unmatched,
    };
  };
};
