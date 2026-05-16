import { AppError } from "./errors.js";

// Ritmik cimnastik aletleri — DB'de slug olarak saklanır, UI'da label gösterilir.
export const APPARATUSES = [
  { slug: "top", label: "Top" },
  { slug: "labut", label: "Labut" },
  { slug: "ip", label: "İp" },
  { slug: "kurdele", label: "Kurdele" },
  { slug: "cember", label: "Çember" },
  { slug: "serbest", label: "Serbest" },
];

export const APPARATUS_SLUGS = new Set(APPARATUSES.map((a) => a.slug));

// "Top", "TOP", "top ", "İp", "IP", "i̇p" → "top" / "ip"
// Tanımlı 6 alet dışında bir şey gelirse null döner.
export const normalizeApparatus = (raw) => {
  const slug = String(raw ?? "")
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/i̇/g, "i")
    .replace(/[\s_-]+/g, "")
    .trim();
  return APPARATUS_SLUGS.has(slug) ? slug : null;
};

// apparatuses dizisini doğrula ve normalize edilmiş, tekrarsız slug array'i döndür.
// expectedCount verilirse uzunluğun ona eşit olması zorunlu (item-bazlı kullanım için).
// Verilmezse "en az 1" davranışı (gelecek için esneklik).
export const validateApparatuses = (input, expectedCount = null) => {
  if (!Array.isArray(input)) {
    throw new AppError("Aletler liste formatında olmalı", 400);
  }
  if (expectedCount === null && input.length === 0) {
    throw new AppError("En az bir alet seçmelisiniz", 400);
  }
  const slugs = [];
  for (const raw of input) {
    const slug = normalizeApparatus(raw);
    if (!slug) {
      throw new AppError(`Geçersiz alet: ${raw}`, 400);
    }
    if (!slugs.includes(slug)) slugs.push(slug);
  }
  if (expectedCount !== null && slugs.length !== expectedCount) {
    throw new AppError(
      `Seri sayısı kadar farklı alet seçmelisiniz (beklenen: ${expectedCount}, alınan: ${slugs.length})`,
      400,
    );
  }
  return slugs;
};
