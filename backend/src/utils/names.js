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
//
// Yarışma bazlı: kayıt yalnızca KENDİ yarışmasının çekim günleriyle karşılaştırılır (Ekim'deki
// bir kayıt Şubat listesinde "var" görünmesin). Yarışması olmayan eski kayıt tüm listeye bakar.
// Tek sorgu: satırlar günün yarışmasıyla birlikte okunur, yarışma başına isim haritası kurulur.
export const shootingListChecker = async () => {
  const entries = await prisma.shootingListEntry.findMany({
    select: { athleteName: true, category: true, day: { select: { tournamentId: true } } },
  });
  const all = new Map(); // nameKey → Set(alet slug)
  const byTournament = new Map(); // tournamentId → (nameKey → Set)
  const add = (map, key, app) => {
    if (!map.has(key)) map.set(key, new Set());
    if (app) map.get(key).add(app);
  };
  for (const e of entries) {
    const key = matchKey(e.athleteName);
    const app = normalizeApparatus(e.category);
    add(all, key, app);
    const tid = e.day?.tournamentId;
    if (tid) {
      if (!byTournament.has(tid)) byTournament.set(tid, new Map());
      add(byTournament.get(tid), key, app);
    }
  }

  return (record) => {
    // Kaydın yarışması varsa yalnızca o yarışmanın listesi; o yarışmaya henüz liste yüklenmediyse null
    const byName = record.tournamentId ? byTournament.get(record.tournamentId) ?? new Map() : all;
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
