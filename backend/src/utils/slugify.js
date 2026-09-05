// R2 klasör adları için Türkçe-uyumlu, URL-güvenli slug üretir.
const TR_MAP = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", Ç: "c", Ğ: "g", İ: "i", I: "i", Ö: "o", Ş: "s", Ü: "u" };

export const slugify = (value, maxLength = 40) => {
  if (!value) return "";
  return String(value)
    .replace(/[çğıöşüÇĞİIÖŞÜ]/g, (ch) => TR_MAP[ch] || ch)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
};
