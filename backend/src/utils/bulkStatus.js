import prisma from "../lib/prisma.js";
import bus from "../lib/events.js";
import { AppError } from "./errors.js";
import { syncPointsForRecord } from "./loyalty.js";
import { generalDeliveryOnStatus, notifyDelivery } from "./delivery.js";

/**
 * Admin toplu durum değiştirme (Paket Siparişleri / Rezervasyonlar → "Seç").
 *
 * Tekil güncellemenin (PATCH/PUT /:id { status }) durum yan etkileri birebir uygulanır:
 * - sadakat puanı senkronu (kullanıcı başı kilit zaten var; burada sırayla beklenir)
 * - DELIVERED'a ilk geçiş = genel teslim: daha önce hiç teslim maili almamış kayda bir kez mail
 * Kayıtlar sırayla işlenir (yüzlerce paralel transaction uzak DB'yi boğmasın), aynı durumdakiler
 * atlanır, çekim listesine sonda tek olay gider.
 */

const ALLOWED = {
  order: ["PENDING", "PAID", "DELIVERED", "FAILED", "CANCELLED"],
  reservation: ["PENDING", "CONFIRMED", "PAID", "DELIVERED", "CANCELLED"],
};
const NOT_FOUND = { order: "Sipariş bulunamadı", reservation: "Rezervasyon bulunamadı" };
export const BULK_MAX = 100;

export const bulkUpdateStatus = async (kind, rawIds, status) => {
  if (!ALLOWED[kind]?.includes(status)) throw new AppError("Geçersiz durum", 400);
  if (!Array.isArray(rawIds) || rawIds.length === 0) {
    throw new AppError(kind === "order" ? "Sipariş seçilmedi" : "Rezervasyon seçilmedi", 400);
  }
  if (rawIds.length > BULK_MAX) throw new AppError(`Tek seferde en fazla ${BULK_MAX} kayıt`, 400);

  const ids = [...new Set(rawIds.map(String))];
  const model = prisma[kind];
  const existing = await model.findMany({
    where: { id: { in: ids } },
    select: { id: true, status: true, deliveries: true },
  });
  const byId = new Map(existing.map((r) => [r.id, r]));

  let updated = 0;
  let skipped = 0;
  let mailed = 0;
  const failed = [];

  for (const id of ids) {
    const current = byId.get(id);
    if (!current) {
      failed.push({ id, message: NOT_FOUND[kind] });
      continue;
    }
    if (current.status === status) {
      skipped += 1;
      continue;
    }
    try {
      const general = status === "DELIVERED" ? generalDeliveryOnStatus(current) : null;
      const record = await model.update({
        where: { id },
        data: { status, ...(general?.data ?? {}) },
        include: { items: true },
      });
      await syncPointsForRecord(kind, record);
      if (general?.notify && record.customerEmail) {
        notifyDelivery(record, "general"); // fire-and-forget, tekil akışla aynı
        mailed += 1;
      }
      updated += 1;
    } catch (err) {
      console.error(`Toplu durum hatası (${kind}):`, id, err);
      failed.push({ id, message: "Güncellenemedi" });
    }
  }

  if (updated > 0) bus.emit("shooting-list-changed");
  return { updated, skipped, mailed, failed };
};

/** POST /api/{orders|reservations}/bulk-status { ids, status } */
export const bulkStatusHandler = (kind) => async (req, res) => {
  const { ids, status } = req.body ?? {};
  const result = await bulkUpdateStatus(kind, ids, status);
  res.json({ message: `${result.updated} kayıt güncellendi`, ...result });
};

/**
 * POST /api/{orders|reservations}/bulk-status/preview { ids, status } → onay penceresi için:
 * kaç kayıt değişecek, kaçı zaten bu durumda, DELIVERED'da kaç kişiye mail gidecek.
 */
export const bulkPreviewHandler = (kind) => async (req, res) => {
  const { ids, status } = req.body ?? {};
  if (!ALLOWED[kind]?.includes(status)) throw new AppError("Geçersiz durum", 400);
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > BULK_MAX) throw new AppError("Geçersiz seçim", 400);
  const rows = await prisma[kind].findMany({
    where: { id: { in: [...new Set(ids.map(String))] } },
    select: { status: true, deliveries: true, customerEmail: true },
  });
  const changing = rows.filter((r) => r.status !== status);
  const willMail =
    status === "DELIVERED"
      ? changing.filter((r) => r.customerEmail && generalDeliveryOnStatus(r).notify).length
      : 0;
  res.json({ changing: changing.length, unchanged: rows.length - changing.length, willMail });
};
