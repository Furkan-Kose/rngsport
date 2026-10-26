// Parça parça teslim: fotoğraflar önce, videolar birkaç gün sonra hazır olur.
// Her parçanın (photo / video / reels / general) teslim tarihi kaydın `deliveries`
// JSON'unda tutulur: { photo: ISO, video: ISO, ... }. Bir parçanın maili BİR KEZ gider;
// tekrar göndermek için `resend` gerekir. İlk teslimat durumu DELIVERED yapar.
import prisma from "../lib/prisma.js";
import bus from "../lib/events.js";
import { AppError, rethrowPrismaError } from "./errors.js";
import { issueSetPasswordTokenIfUnclaimed } from "./customerAccount.js";
import { sendDeliveryEmail } from "../lib/mail.js";
import { syncPointsForRecord } from "./loyalty.js";

export const DELIVERY_TYPES = ["photo", "video", "reels", "general"];

// Reels ayrı bir video paketi (kategori "video"); slug ile ayırt edilir
const REELS_PACKAGES = new Set(["video-reels"]);

// Kaydın paketlerine göre hangi parçalar teslim edilecek
export const deliveryContents = (items = []) => {
  const has = { photo: false, video: false, reels: false };
  for (const item of items) {
    if (REELS_PACKAGES.has(item.packageId)) {
      has.reels = true;
      continue;
    }
    if (item.category === "photo" || item.category === "full") has.photo = true;
    if (item.category === "video" || item.category === "full") has.video = true;
  }
  return has;
};

const KINDS = {
  reservation: {
    notFound: "Rezervasyon bulunamadı",
    blocked: ["CANCELLED"],
    blockedMessage: "İptal edilmiş rezervasyon teslim edilemez",
  },
  order: {
    notFound: "Sipariş bulunamadı",
    blocked: ["PENDING", "FAILED", "CANCELLED"],
    blockedMessage: "Ödenmemiş veya iptal edilmiş sipariş teslim edilemez",
  },
};

// Teslimat maili (fire-and-forget). Hesap hâlâ şifresizse şifre belirleme linkiyle gider.
// Fotoğraf maili, paketteki video/reels henüz teslim edilmediyse "videolar ayrıca gelecek" der.
export const notifyDelivery = (record, type) => {
  if (!record.customerEmail) return;
  const has = deliveryContents(record.items);
  const done = record.deliveries ?? {};
  const moreLater = type === "photo" && ((has.video && !done.video) || (has.reels && !done.reels));
  issueSetPasswordTokenIfUnclaimed(record.userId)
    .then((token) =>
      sendDeliveryEmail(record.customerEmail, record.athleteName, token, record.locale, { type, moreLater })
    )
    .catch((err) => console.error("[mail] Teslimat maili hatası:", err));
};

// Admin: bir parçayı teslim et. Dönen `mailed` mailin gönderilip gönderilmediğini söyler.
export const deliverRecord = async (kind, id, { type, resend = false } = {}) => {
  if (!DELIVERY_TYPES.includes(type)) throw new AppError("Geçersiz teslimat türü", 400);
  const cfg = KINDS[kind];

  const existing = await prisma[kind].findUnique({
    where: { id },
    select: { status: true, deliveries: true },
  });
  if (!existing) throw new AppError(cfg.notFound, 404);
  if (cfg.blocked.includes(existing.status)) throw new AppError(cfg.blockedMessage, 400);

  const previous = existing.deliveries ?? {};
  const already = Boolean(previous[type]);
  const firstDelivery = existing.status !== "DELIVERED";

  const record = await prisma[kind]
    .update({
      where: { id },
      data: {
        ...(!already && { deliveries: { ...previous, [type]: new Date().toISOString() } }),
        ...(firstDelivery && { status: "DELIVERED" }),
      },
      include: { items: true },
    })
    .catch(rethrowPrismaError({ notFound: cfg.notFound }));

  if (firstDelivery) {
    // DELIVERED ödenmiş sayılır: puan + çekim listesi eşleşmesi
    syncPointsForRecord(kind, record);
    bus.emit("shooting-list-changed");
  }

  const mailed = (!already || resend) && Boolean(record.customerEmail);
  if (mailed) notifyDelivery(record, type);
  return { record, mailed, already };
};

// Durum seçicisinden elle DELIVERED: genel teslim sayılır. Daha önce parça teslimi
// yapılmışsa (durum geri alınıp tekrar DELIVERED yapıldıysa) ikinci mail gitmez.
export const generalDeliveryOnStatus = (existing) => {
  const previous = existing.deliveries ?? {};
  if (Object.keys(previous).length > 0) return { data: {}, notify: false };
  return { data: { deliveries: { general: new Date().toISOString() } }, notify: true };
};
