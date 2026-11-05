import * as XLSX from "xlsx";
import { APPARATUSES } from "./apparatuses.js";

/**
 * Admin Excel dışa aktarmaları (Paket Siparişleri, Rezervasyonlar, Çekim Listesi) için ortak yardımcılar.
 *
 * Sütun tanımı: { key, label, get(row) }. İstemci `GET …/export/columns` ile listeyi alır,
 * kullanıcı seçtiği anahtarları `?columns=a,b,c` olarak gönderir. Bilinmeyen anahtar yok sayılır;
 * hiç seçim yoksa (eski çağrılar) tüm sütunlar kullanılır.
 */

const TZ = "Europe/Istanbul"; // Sunucu UTC'de; Excel'deki saatler Türkiye saatiyle yazılır

export const excelDateTime = (value) =>
  value ? new Date(value).toLocaleString("tr-TR", { timeZone: TZ }) : "";

export const excelDate = (value) =>
  value ? new Date(value).toLocaleDateString("tr-TR", { timeZone: TZ }) : "";

const APPARATUS_LABEL = Object.fromEntries(APPARATUSES.map((a) => [a.slug, a.label]));
export const apparatusLabels = (slugs = []) => slugs.map((s) => APPARATUS_LABEL[s] ?? s).join(", ");

export const safeSheetName = (label) =>
  String(label || "Liste")
    .replace(/[\\/?*[\]:]/g, " ")
    .trim()
    .slice(0, 31) || "Liste";

/** İstemciye gönderilecek sütun listesi (get fonksiyonu olmadan) */
export const columnList = (defs) => defs.map(({ key, label, group }) => ({ key, label, ...(group && { group }) }));

/** ?columns=a,b,c → seçilen tanımlar (istemcinin seçtiği sırayla değil, tanım sırasıyla) */
export const pickColumns = (defs, raw) => {
  const wanted = new Set(
    String(raw || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  if (wanted.size === 0) return defs;
  const picked = defs.filter((d) => wanted.has(d.key));
  return picked.length ? picked : defs;
};

/** Satırları seçili sütunlarla xlsx buffer'ına çevirir; genişlikler içeriğe göre ayarlanır */
export const buildXlsx = (records, columns, sheetName) => {
  const header = columns.map((c) => c.label);
  const body = records.map((r) => columns.map((c) => {
    const value = c.get(r);
    return value === null || value === undefined ? "" : value;
  }));
  const worksheet = XLSX.utils.aoa_to_sheet([header, ...body]);
  worksheet["!cols"] = header.map((label, i) => {
    const longest = body.reduce((max, row) => Math.max(max, String(row[i] ?? "").length), label.length);
    return { wch: Math.min(60, Math.max(10, longest + 2)) }; // +2 nefes payı, 10–60 arası
  });
  worksheet["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: body.length, c: header.length - 1 } }) };
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName(sheetName));
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};

export const sendXlsx = (res, buffer, fileName) => {
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
  res.send(buffer);
};

// ---------------------------------------------------------------------------
// Paket siparişi + rezervasyon ortak sütunları
// ---------------------------------------------------------------------------

const ORDER_STATUS_TR = {
  PENDING: "Bekliyor",
  CONFIRMED: "Onaylandı",
  PAID: "Ödendi",
  DELIVERED: "Teslim Edildi",
  FAILED: "Başarısız",
  CANCELLED: "İptal",
};
const MATCH_TR = { full: "Tam", partial: "Kısmi (alet uyuşmuyor)", none: "Listede yok" };
const CATEGORY_TR = { photo: "Fotoğraf", video: "Video", full: "Full Paket" };

const itemsText = (items = []) =>
  items
    .map((it) => `${it.packageName}${it.priority ? " [ÖNCELİKLİ]" : ""} · ${it.seriesCount} seri × ${it.quantity}`)
    .join("; ");

const deliveryOf = (r, type) => excelDate(r.deliveries?.[type]);

/** Kayıt `{ ...record, listMatch, unmatchedApparatuses }` biçiminde gelir (shootingListChecker) */
export const recordColumns = ({ withPaymentId = false } = {}) => [
  { key: "athleteName", label: "Sporcu", group: "Sporcu", get: (r) => r.athleteName },
  { key: "clubName", label: "Kulüp", group: "Sporcu", get: (r) => r.clubName },
  { key: "birthYear", label: "Doğum Yılı", group: "Sporcu", get: (r) => r.birthYear },
  { key: "customerPhone", label: "Telefon", group: "İletişim", get: (r) => r.customerPhone },
  { key: "customerEmail", label: "E-posta", group: "İletişim", get: (r) => r.customerEmail },
  { key: "packages", label: "Paketler", group: "Paket", get: (r) => itemsText(r.items) },
  {
    key: "categories",
    label: "Kategori",
    group: "Paket",
    get: (r) => [...new Set((r.items || []).map((it) => CATEGORY_TR[it.category] ?? it.category))].join(", "),
  },
  {
    key: "apparatuses",
    label: "Aletler",
    group: "Paket",
    get: (r) => (r.items || []).map((it) => apparatusLabels(it.apparatuses)).filter(Boolean).join("; "),
  },
  { key: "priority", label: "Öncelikli", group: "Paket", get: (r) => ((r.items || []).some((it) => it.priority) ? "Evet" : "Hayır") },
  { key: "subtotal", label: "Ara Toplam (₺)", group: "Tutar", get: (r) => r.subtotal ?? r.totalPrice },
  { key: "discountPercent", label: "İndirim %", group: "Tutar", get: (r) => r.discountPercent || 0 },
  { key: "discountAmount", label: "İndirim Tutarı (₺)", group: "Tutar", get: (r) => r.discountAmount || 0 },
  { key: "totalPrice", label: "Toplam (₺)", group: "Tutar", get: (r) => r.totalPrice },
  ...(withPaymentId ? [{ key: "paymentId", label: "Ödeme No (iyzico)", group: "Tutar", get: (r) => r.paymentId }] : []),
  { key: "status", label: "Durum", group: "Durum", get: (r) => ORDER_STATUS_TR[r.status] ?? r.status },
  { key: "deliveredPhoto", label: "Foto Teslim", group: "Durum", get: (r) => deliveryOf(r, "photo") },
  { key: "deliveredVideo", label: "Video Teslim", group: "Durum", get: (r) => deliveryOf(r, "video") },
  { key: "deliveredReels", label: "Reels Teslim", group: "Durum", get: (r) => deliveryOf(r, "reels") },
  { key: "listMatch", label: "Çekim Listesi Eşleşmesi", group: "Durum", get: (r) => (r.listMatch ? MATCH_TR[r.listMatch] : "") },
  { key: "unmatched", label: "Eşleşmeyen Aletler", group: "Durum", get: (r) => apparatusLabels(r.unmatchedApparatuses || []) },
  { key: "notes", label: "Not", group: "Diğer", get: (r) => r.notes },
  { key: "locale", label: "Dil", group: "Diğer", get: (r) => (r.locale || "tr").toUpperCase() },
  { key: "createdAt", label: "Oluşturma Tarihi", group: "Diğer", get: (r) => excelDateTime(r.createdAt) },
];

// ---------------------------------------------------------------------------
// Ürün (kişiye özel) siparişleri
// ---------------------------------------------------------------------------

const SHOP_STATUS_TR = {
  PENDING: "Ödeme bekleniyor",
  FAILED: "Ödeme başarısız",
  CONFIRMED: "Onaylandı",
  IN_PRODUCTION: "Hazırlanıyor",
  SHIPPED: "Kargoda",
  DELIVERED: "Teslim edildi",
  CANCELLED: "İptal",
};

const personalizationText = (o) =>
  Object.entries(o.personalization || {})
    .map(([key, value]) => `${o.fieldLabels?.[key] || key}: ${value}`)
    .join(" | ");

export const shopOrderColumns = [
  { key: "createdAt", label: "Sipariş Tarihi", group: "Sipariş", get: (o) => excelDateTime(o.createdAt) },
  { key: "id", label: "Sipariş No", group: "Sipariş", get: (o) => o.id },
  { key: "productName", label: "Ürün", group: "Sipariş", get: (o) => o.productName },
  { key: "quantity", label: "Adet", group: "Sipariş", get: (o) => o.quantity },
  { key: "apparatus", label: "Alet", group: "Seçim", get: (o) => apparatusLabels(o.selection?.apparatus ? [o.selection.apparatus] : []) },
  {
    key: "pose",
    label: "Poz",
    group: "Seçim",
    get: (o) => (o.selection?.poseNo ? `Poz ${o.selection.poseNo}${o.selection.poseLabel ? ` — ${o.selection.poseLabel}` : ""}` : ""),
  },
  { key: "personalization", label: "Kişiselleştirme", group: "Seçim", get: personalizationText },
  { key: "recipientName", label: "Alıcı", group: "Teslimat", get: (o) => o.recipientName },
  { key: "phone", label: "Telefon", group: "Teslimat", get: (o) => o.phone },
  { key: "email", label: "E-posta (hesap)", group: "Teslimat", get: (o) => o.user?.email ?? "" },
  { key: "city", label: "İl", group: "Teslimat", get: (o) => o.city },
  { key: "district", label: "İlçe", group: "Teslimat", get: (o) => o.district },
  { key: "address", label: "Açık Adres", group: "Teslimat", get: (o) => o.address },
  { key: "postalCode", label: "Posta Kodu", group: "Teslimat", get: (o) => o.postalCode },
  { key: "customerNote", label: "Müşteri Notu", group: "Teslimat", get: (o) => o.customerNote },
  { key: "totalPrice", label: "Tutar (₺)", group: "Durum", get: (o) => o.totalPrice },
  { key: "status", label: "Durum", group: "Durum", get: (o) => SHOP_STATUS_TR[o.status] ?? o.status },
  { key: "trackingInfo", label: "Kargo Bilgisi", group: "Durum", get: (o) => o.trackingInfo },
  { key: "adminNote", label: "Admin Notu", group: "Durum", get: (o) => o.adminNote },
  { key: "paymentId", label: "Ödeme No (iyzico)", group: "Durum", get: (o) => o.paymentId },
  { key: "paidAt", label: "Ödeme Tarihi", group: "Tarihler", get: (o) => excelDateTime(o.paidAt) },
  { key: "shippedAt", label: "Kargo Tarihi", group: "Tarihler", get: (o) => excelDateTime(o.shippedAt) },
  { key: "deliveredAt", label: "Teslim Tarihi", group: "Tarihler", get: (o) => excelDateTime(o.deliveredAt) },
  { key: "locale", label: "Dil", group: "Tarihler", get: (o) => (o.locale || "tr").toUpperCase() },
];

