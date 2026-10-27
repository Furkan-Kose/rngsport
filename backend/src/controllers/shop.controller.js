import crypto from "node:crypto";
import prisma from "../lib/prisma.js";
import { AppError, rethrowPrismaError } from "../utils/errors.js";
import { presignUpload, deleteObject } from "../lib/r2.js";
import { localize, normalizeLocale, sanitizeTranslations, translateMessage, LOCALES } from "../utils/i18n.js";
import { validatePhone } from "../utils/validators.js";
import { slugify } from "../utils/slugify.js";
import { serveR2Image } from "../utils/r2Image.js";
import { Iyzipay, iyzicoDate, iyzicoLocale, initializeCheckout, retrieveCheckout } from "../utils/iyzicoCheckout.js";
import { sendShopOrderPaidEmail, sendShopOrderStatusEmail } from "../lib/mail.js";
import { APPARATUSES } from "../utils/apparatuses.js";

// Mağaza: kişiye özel ürünler. Paket siparişlerinden (Order) tamamen ayrı tablolar,
// ayrı iyzico dönüşü (/api/shop/payment/callback); sadakat puanı ve çekim listesi yok.
// Kargo entegrasyonu yok: durumu admin elle verir, müşteri profilinden görür.

const IMAGE_PREFIX = "urunler/";
const IMAGE_FILE_REGEX = /^[a-z0-9-]+\.(webp|jpe?g|png)$/;
const IMAGE_EXTENSIONS = new Set(["webp", "jpg", "jpeg", "png"]);
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export const SHOP_STATUSES = ["PENDING", "FAILED", "CONFIRMED", "IN_PRODUCTION", "SHIPPED", "DELIVERED", "CANCELLED"];
// Ödemesi alınmış durumlar (admin "Ödenenler" sekmesi)
const PAID_STATUSES = ["CONFIRMED", "IN_PRODUCTION", "SHIPPED", "DELIVERED"];
const UNPAID_STATUSES = ["PENDING", "FAILED"];
const MAX_QUANTITY = 5;
const MAX_FIELDS = 10;
const POSES_PER_APPARATUS = 3;

const TEXT_FIELDS = ["name", "tagline", "summary", "description"];
const PRODUCT_NOT_FOUND = { notFound: "Ürün bulunamadı", duplicate: "Bu adres (slug) başka bir üründe kullanılıyor" };
const ORDER_NOT_FOUND = "Sipariş bulunamadı";

const BACKEND_URL = () => process.env.BACKEND_URL || "http://localhost:3000";
const FRONTEND_URL = () => process.env.FRONTEND_URL || "http://localhost:5173";

const text = (value, max) => {
  const trimmed = value == null ? "" : String(value).trim().slice(0, max);
  return trimmed || null;
};

// R2'deki görsel → sabit proxy URL; eski /products/*.jpeg (client/public) ve harici URL olduğu gibi
const resolveImage = (image) =>
  image?.startsWith(IMAGE_PREFIX) ? `${BACKEND_URL()}/api/shop/image/${image.slice(IMAGE_PREFIX.length)}` : image || null;

// ---------------------------------------------------------------------------
// Kişiselleştirme alanları: [{ key, label, required, maxLength }]
// ---------------------------------------------------------------------------
const sanitizeCustomFields = (input) => {
  if (!Array.isArray(input)) return [];
  const used = new Set();
  const out = [];
  for (const raw of input.slice(0, MAX_FIELDS)) {
    const label = text(raw?.label, 60);
    if (!label) continue;
    let key = slugify(raw?.key || label, 30).replace(/-/g, "_") || `alan_${out.length + 1}`;
    while (used.has(key)) key = `${key}_${out.length + 1}`;
    used.add(key);
    const maxLength = Math.min(500, Math.max(1, parseInt(raw?.maxLength) || 100));
    out.push({ key, label, required: Boolean(raw?.required), maxLength });
  }
  return out;
};

// translations: metin alanları + { fields: { key: label } } (alan adlarının çevirisi)
const sanitizeProductTranslations = (input, customFields) => {
  const base = sanitizeTranslations(input, { stringFields: TEXT_FIELDS });
  if (base === undefined) return undefined;
  const keys = new Set(customFields.map((f) => f.key));
  for (const locale of LOCALES.filter((l) => l !== "tr")) {
    const fields = input?.[locale]?.fields;
    if (!fields || typeof fields !== "object") continue;
    const clean = {};
    for (const [key, label] of Object.entries(fields)) {
      const value = text(label, 60);
      if (keys.has(key) && value) clean[key] = value;
    }
    if (Object.keys(clean).length) base[locale] = { ...(base[locale] || {}), fields: clean };
  }
  return base;
};

const fieldsFor = (product, locale) => {
  const labels = product.translations?.[locale]?.fields || {};
  return (Array.isArray(product.customFields) ? product.customFields : []).map((f) => ({
    ...f,
    label: locale === "tr" ? f.label : labels[f.key] || f.label,
  }));
};

// ---------------------------------------------------------------------------
// Alet → poz seçimi: { enabled, apparatuses: [{ slug, enabled, poses: [{ no, image, label }] }] }
// Aletler APPARATUSES sırasıyla (6 alet), her alette 3 poz yeri. Görsel yalnızca urunler/ key'i.
// ---------------------------------------------------------------------------
const isProductImageKey = (key) =>
  typeof key === "string" && key.startsWith(IMAGE_PREFIX) && IMAGE_FILE_REGEX.test(key.slice(IMAGE_PREFIX.length));

const sanitizePoseOptions = (input) => {
  const src = input && typeof input === "object" ? input : {};
  const bySlug = new Map((Array.isArray(src.apparatuses) ? src.apparatuses : []).map((a) => [a?.slug, a]));
  return {
    enabled: Boolean(src.enabled),
    apparatuses: APPARATUSES.map(({ slug }) => {
      const a = bySlug.get(slug) || {};
      const poses = Array.isArray(a.poses) ? a.poses : [];
      return {
        slug,
        enabled: Boolean(a.enabled),
        poses: Array.from({ length: POSES_PER_APPARATUS }, (_, i) => {
          const p = poses.find((x) => Number(x?.no) === i + 1) || {};
          return { no: i + 1, image: isProductImageKey(p.image) ? p.image : null, label: text(p.label, 40) };
        }),
      };
    }),
  };
};

// Müşterinin seçebileceği aletler: açık ve en az bir fotoğraflı pozu olanlar (yalnızca fotoğraflı pozlar)
const selectableApparatuses = (product) => {
  const opts = product.poseOptions;
  if (!opts?.enabled || !Array.isArray(opts.apparatuses)) return [];
  return opts.apparatuses
    .filter((a) => a.enabled)
    .map((a) => ({ slug: a.slug, poses: (a.poses || []).filter((p) => p.image) }))
    .filter((a) => a.poses.length > 0);
};

const usesPoses = (product) => Boolean(product.poseOptions?.enabled);

const poseImageKeys = (opts) =>
  new Set((opts?.apparatuses || []).flatMap((a) => (a.poses || []).map((p) => p.image)).filter(Boolean));

const isPurchasable = (p) =>
  p.isActive && typeof p.price === "number" && p.price > 0 && (!usesPoses(p) || selectableApparatuses(p).length > 0);

const formatPublicProduct = (raw, locale) => {
  const p = localize(raw, locale, TEXT_FIELDS);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    summary: p.summary,
    description: p.description,
    price: p.price,
    image: resolveImage(p.image),
    // Detay galerisi: kapak + ek fotoğraflar (sırasıyla)
    images: [p.image, ...(p.images ?? [])].filter(Boolean).map(resolveImage),
    customFields: fieldsFor(raw, locale),
    poseOptions: usesPoses(raw)
      ? {
          enabled: true,
          apparatuses: selectableApparatuses(raw).map((a) => ({
            slug: a.slug,
            poses: a.poses.map((pose) => ({ no: pose.no, label: pose.label, image: resolveImage(pose.image) })),
          })),
        }
      : null,
    purchasable: isPurchasable(raw),
  };
};

const formatAdminProduct = (p) => {
  const opts = sanitizePoseOptions(p.poseOptions);
  return {
    ...p,
    imageUrl: resolveImage(p.image),
    images: p.images ?? [],
    imageUrls: (p.images ?? []).map(resolveImage),
    customFields: Array.isArray(p.customFields) ? p.customFields : [],
    translations: p.translations ?? {},
    poseOptions: {
      ...opts,
      apparatuses: opts.apparatuses.map((a) => ({
        ...a,
        poses: a.poses.map((pose) => ({ ...pose, imageUrl: resolveImage(pose.image) })),
      })),
    },
  };
};

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------
export const listProducts = async (req, res) => {
  const products = await prisma.shopProduct.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  res.json(products.map((p) => formatPublicProduct(p, req.locale)));
};

export const getProduct = async (req, res) => {
  const product = await prisma.shopProduct.findUnique({ where: { slug: String(req.params.slug) } });
  if (!product || !product.isActive) throw new AppError("Ürün bulunamadı", 404);
  res.json(formatPublicProduct(product, req.locale));
};

export const serveProductImage = (req, res) => serveR2Image(res, IMAGE_PREFIX, req.params.file, IMAGE_FILE_REGEX);

// ---------------------------------------------------------------------------
// Müşteri siparişi
// ---------------------------------------------------------------------------
const validateShipping = (input = {}) => {
  const recipientName = text(input.recipientName, 100);
  if (!recipientName || recipientName.length < 2) throw new AppError("Alıcı adı soyadı gerekli", 400);
  const city = text(input.city, 50);
  const district = text(input.district, 50);
  if (!city || !district) throw new AppError("İl ve ilçe gerekli", 400);
  const address = text(input.address, 500);
  if (!address || address.length < 10) throw new AppError("Açık adres en az 10 karakter olmalı", 400);
  return {
    recipientName,
    phone: validatePhone(input.phone ?? ""),
    city,
    district,
    address,
    postalCode: text(input.postalCode, 10),
    customerNote: text(input.note ?? input.customerNote, 500),
  };
};

// Ürünün tanımlı alanları dışındakiler yok sayılır; zorunlular kontrol edilir
const validatePersonalization = (product, input = {}) => {
  const fields = Array.isArray(product.customFields) ? product.customFields : [];
  const values = {};
  const labels = {};
  for (const field of fields) {
    const value = text(input?.[field.key], field.maxLength || 100);
    if (field.required && !value) throw new AppError(`Zorunlu alan eksik: ${field.label}`, 400);
    if (value) values[field.key] = value;
    labels[field.key] = field.label;
  }
  return { values, labels };
};

// Poz seçimli üründe alet + poz zorunlu ve gerçekten seçilebilir olmalı; seçim siparişe kopyalanır
const validateSelection = (product, input) => {
  if (!usesPoses(product)) return null;
  const apparatus = selectableApparatuses(product).find((a) => a.slug === input?.apparatus);
  const poseNo = Number(input?.poseNo);
  if (!input?.apparatus || !poseNo) throw new AppError("Lütfen alet ve poz seçin", 400);
  const pose = apparatus?.poses.find((p) => p.no === poseNo);
  if (!pose) throw new AppError("Seçilen poz artık mevcut değil, lütfen başka bir poz seçin", 400);
  return { apparatus: apparatus.slug, poseNo, poseLabel: pose.label ?? null, poseImage: pose.image };
};

const formatSelection = (selection) =>
  selection ? { ...selection, poseImage: resolveImage(selection.poseImage) } : null;

const formatOrder = (o) => ({
  id: o.id,
  productName: o.productName,
  productSlug: o.productSlug,
  productImage: resolveImage(o.product?.image) ?? null,
  unitPrice: o.unitPrice,
  quantity: o.quantity,
  totalPrice: o.totalPrice,
  personalization: o.personalization,
  fieldLabels: o.fieldLabels ?? {},
  selection: formatSelection(o.selection),
  recipientName: o.recipientName,
  phone: o.phone,
  city: o.city,
  district: o.district,
  address: o.address,
  postalCode: o.postalCode,
  customerNote: o.customerNote,
  trackingInfo: o.trackingInfo,
  status: o.status,
  paidAt: o.paidAt,
  shippedAt: o.shippedAt,
  deliveredAt: o.deliveredAt,
  createdAt: o.createdAt,
});

export const createOrder = async (req, res) => {
  const slug = String(req.body?.productSlug ?? "");
  const product = await prisma.shopProduct.findUnique({ where: { slug } });
  if (!product || !isPurchasable(product)) throw new AppError("Bu ürün şu an satışta değil", 400);

  const quantity = Math.min(MAX_QUANTITY, Math.max(1, parseInt(req.body?.quantity) || 1));
  const selection = validateSelection(product, req.body?.selection);
  const { values, labels } = validatePersonalization(product, req.body?.personalization);
  const shipping = validateShipping(req.body?.shipping);
  // Fiyat her zaman DB'den; istemciden gelen tutar yok sayılır
  const totalPrice = Math.round(product.price * quantity * 100) / 100;

  const order = await prisma.shopOrder.create({
    data: {
      userId: req.user.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      unitPrice: product.price,
      quantity,
      totalPrice,
      personalization: values,
      fieldLabels: labels,
      ...(selection && { selection }),
      ...shipping,
      locale: normalizeLocale(req.locale),
    },
    include: { product: { select: { image: true } } },
  });
  res.status(201).json({ message: "Sipariş oluşturuldu", order: formatOrder(order) });
};

const findOwnOrder = async (req) => {
  const order = await prisma.shopOrder.findUnique({
    where: { id: String(req.params.id) },
    include: { product: { select: { image: true } } },
  });
  // Başkasının siparişi de "yok" görünür (varlığı sızmasın)
  if (!order || order.userId !== req.user.id) throw new AppError(ORDER_NOT_FOUND, 404);
  return order;
};

export const getMyOrders = async (req, res) => {
  // Yarım kalmış ödemeler yalnızca 7 gün listede kalır (her deneme ayrı kayıt açıyor)
  const recent = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const orders = await prisma.shopOrder.findMany({
    where: {
      userId: req.user.id,
      OR: [{ status: { notIn: UNPAID_STATUSES } }, { createdAt: { gte: recent } }],
    },
    orderBy: { createdAt: "desc" },
    include: { product: { select: { image: true } } },
  });
  res.json(orders.map(formatOrder));
};

export const getMyOrder = async (req, res) => {
  res.json(formatOrder(await findOwnOrder(req)));
};

// Formu doldurmak için son siparişteki adres (yoksa hesaptaki ad/telefon)
export const getLastAddress = async (req, res) => {
  const last = await prisma.shopOrder.findFirst({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    select: { recipientName: true, phone: true, city: true, district: true, address: true, postalCode: true },
  });
  if (last) return res.json(last);
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true, phone: true } });
  res.json({ recipientName: user?.name ?? "", phone: user?.phone ?? "" });
};

// ---------------------------------------------------------------------------
// iyzico
// ---------------------------------------------------------------------------
const splitName = (fullName) => {
  const parts = String(fullName).trim().split(/\s+/);
  return { name: parts[0] || "Müşteri", surname: parts.slice(1).join(" ") || parts[0] || "Müşteri" };
};

export const startCheckout = async (req, res) => {
  const order = await findOwnOrder(req);
  if (!UNPAID_STATUSES.includes(order.status)) throw new AppError("Bu sipariş için ödeme yapılamaz", 400);

  const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { email: true, createdAt: true } });
  if (!user?.email) throw new AppError("Ödeme için hesabınızda e-posta adresi olmalı", 400);

  const conversationId = `shop_${order.id}_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
  await prisma.shopOrder.update({ where: { id: order.id }, data: { conversationId } });

  const { name, surname } = splitName(order.recipientName);
  const fullAddress = `${order.address} ${order.district}/${order.city}`.slice(0, 500);
  const addressBlock = {
    contactName: order.recipientName,
    city: order.city,
    country: "Turkey",
    address: fullAddress,
    zipCode: order.postalCode || "00000",
  };
  const price = order.totalPrice.toFixed(2);

  const result = await initializeCheckout({
    locale: iyzicoLocale(order.locale),
    conversationId,
    price,
    paidPrice: price,
    currency: Iyzipay.CURRENCY.TRY,
    basketId: order.id,
    paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
    callbackUrl: `${BACKEND_URL()}/api/shop/payment/callback`,
    enabledInstallments: [1],
    buyer: {
      id: req.user.id,
      name,
      surname,
      gsmNumber: order.phone.replace(/[\s()-]/g, ""),
      email: user.email,
      identityNumber: "11111111111",
      lastLoginDate: iyzicoDate(),
      registrationDate: iyzicoDate(user.createdAt),
      registrationAddress: fullAddress,
      ip: req.ip || "85.34.78.112",
      city: order.city,
      country: "Turkey",
      zipCode: order.postalCode || "00000",
    },
    shippingAddress: addressBlock,
    billingAddress: addressBlock,
    // Tek kalem: tutar adetle çarpılmış toplam (iyzico kalem toplamı = ödenecek tutar)
    basketItems: [
      {
        id: order.id,
        name: `${order.productName}${order.quantity > 1 ? ` x${order.quantity}` : ""}`.slice(0, 200),
        category1: "Kişiye Özel Ürün",
        itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
        price,
      },
    ],
  }).catch((err) => {
    console.error("[shop] iyzico error:", err);
    throw new AppError("Ödeme başlatılamadı", 502);
  });

  if (result.status !== "success") {
    console.error("[shop] iyzico result error:", result.errorCode, result.errorMessage);
    throw new AppError(result.errorMessage || "Ödeme formu oluşturulamadı", 400);
  }
  res.json({
    checkoutFormContent: result.checkoutFormContent,
    paymentPageUrl: result.paymentPageUrl,
    token: result.token,
  });
};

// Ödeme sonucu sayfası siparişin dilinde: /urun-siparisi/:id?odeme=basarili|basarisiz
const resultUrl = (locale, id, { ok, error } = {}) => {
  const lang = normalizeLocale(locale);
  const params = new URLSearchParams({ odeme: ok ? "basarili" : "basarisiz" });
  if (error) params.set("hata", translateMessage(error, lang));
  const prefix = lang === "tr" ? "" : `/${lang}`;
  return id
    ? `${FRONTEND_URL()}${prefix}/urun-siparisi/${id}?${params}`
    : `${FRONTEND_URL()}${prefix}/profil?${params}`;
};

// iyzico doğrudan POST eder (CORS'tan muaf). Sonuç her zaman iyzico'dan token ile
// yeniden sorgulanır; gövdedeki bilgilere güvenilmez.
export const paymentCallback = async (req, res) => {
  try {
    const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
    if (token.length < 10 || token.length > 200) {
      return res.redirect(resultUrl("tr", null, { error: "Geçersiz token" }));
    }

    const result = await retrieveCheckout(token);
    const order = result.basketId
      ? await prisma.shopOrder.findUnique({ where: { id: String(result.basketId) } })
      : null;
    if (!order) {
      console.error("[shop] Callback: sipariş bulunamadı", result.basketId);
      return res.redirect(resultUrl("tr", null, { error: "Sipariş bulunamadı" }));
    }

    // Tekrar gelen callback: ödenmiş siparişe dokunma
    if (!UNPAID_STATUSES.includes(order.status)) {
      return res.redirect(resultUrl(order.locale, order.id, { ok: true }));
    }
    // Replay koruması: iyzico sonucu bir conversationId döndürdüyse bu denemeninki olmalı.
    // DİKKAT: checkoutForm.retrieve yanıtında conversationId genelde BOŞ gelir (iyzico sorgu
    // isteğinin kendi conversationId'sini yansıtır). Boşken reddetmek ödemesi ALINMIŞ siparişi
    // "doğrulama hatası" ile düşürüyordu (2026-10-26). Asıl güvence: token iyzico'dan geliyor,
    // sonuç token ile iyzico'dan yeniden okunuyor, basketId siparişi, paidPrice tutarı doğruluyor.
    // Paket ödemesi (payment.controller.js) de aynı kuralı kullanır.
    if (result.conversationId && order.conversationId !== result.conversationId) {
      console.error(`[shop] ConversationId uyuşmuyor: ${order.id}`);
      return res.redirect(resultUrl(order.locale, order.id, { error: "Ödeme doğrulama hatası" }));
    }

    if (result.paymentStatus !== "SUCCESS") {
      await prisma.shopOrder.update({ where: { id: order.id }, data: { status: "FAILED" } });
      return res.redirect(
        resultUrl(order.locale, order.id, { error: result.errorMessage || "Ödeme işlemi başarısız oldu" })
      );
    }

    const paid = parseFloat(result.paidPrice);
    if (Number.isNaN(paid) || paid + 0.001 < order.totalPrice) {
      console.error(`[shop] Tutar uyuşmazlığı ${order.id}: beklenen ${order.totalPrice}, ödenen ${paid}`);
      await prisma.shopOrder.update({
        where: { id: order.id },
        data: { status: "FAILED", adminNote: `Tutar uyuşmazlığı: beklenen ${order.totalPrice}, ödenen ${paid}` },
      });
      return res.redirect(resultUrl(order.locale, order.id, { error: "Ödeme tutarı doğrulanamadı" }));
    }

    // Yalnızca hâlâ ödenmemişse güncelle (eşzamanlı iki callback'te mail tek gider)
    const { count } = await prisma.shopOrder.updateMany({
      where: { id: order.id, status: { in: UNPAID_STATUSES } },
      data: {
        status: "CONFIRMED",
        paidAt: new Date(),
        paymentId: result.paymentId ? String(result.paymentId).slice(0, 100) : null,
      },
    });
    if (count === 1) {
      const user = order.userId
        ? await prisma.user.findUnique({ where: { id: order.userId }, select: { email: true } })
        : null;
      if (user?.email) sendShopOrderPaidEmail(user.email, { ...order, status: "CONFIRMED" });
    }
    return res.redirect(resultUrl(order.locale, order.id, { ok: true }));
  } catch (error) {
    console.error("[shop] Payment callback error:", error);
    return res.redirect(resultUrl("tr", null, { error: "Bir hata oluştu" }));
  }
};

// ---------------------------------------------------------------------------
// Admin: ürünler
// ---------------------------------------------------------------------------
export const listProductsAdmin = async (req, res) => {
  const products = await prisma.shopProduct.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { orders: true } } },
  });
  res.json(products.map((p) => ({ ...formatAdminProduct(p), orderCount: p._count.orders })));
};

const parsePrice = (value) => {
  if (value === null || value === "") return null;
  const price = Number(value);
  if (!Number.isFinite(price) || price < 0 || price > 1_000_000) throw new AppError("Geçersiz fiyat", 400);
  return Math.round(price * 100) / 100;
};

// Ek fotoğraflar: yalnızca bizim R2 anahtarlarımız ya da eski /products/* yolları; tekrarsız, en fazla 10
const MAX_EXTRA_IMAGES = 10;
const sanitizeExtraImages = (input) => {
  if (!Array.isArray(input)) throw new AppError("Geçersiz fotoğraf listesi", 400);
  const valid = input.filter(
    (k) => isProductImageKey(k) || (typeof k === "string" && /^\/products\/[\w.-]+\.(jpe?g|png|webp)$/i.test(k))
  );
  const unique = [...new Set(valid)];
  if (unique.length > MAX_EXTRA_IMAGES) throw new AppError("En fazla 10 ek fotoğraf eklenebilir", 400);
  return unique;
};

const productData = (body, { partial }) => {
  const data = {};
  if (!partial || body.name !== undefined) {
    const name = text(body.name, 120);
    if (!name) throw new AppError("Ürün adı gerekli", 400);
    data.name = name;
  }
  // Yeni üründe slug boşsa addan üretilir; düzenlemede yalnızca gönderilirse değişir
  if (!partial || body.slug !== undefined) {
    const slug = slugify(body.slug || (!partial ? body.name : "") || "", 60);
    if (!slug) throw new AppError("Ürün adresi (slug) gerekli", 400);
    data.slug = slug;
  }
  if (body.tagline !== undefined) data.tagline = text(body.tagline, 200);
  if (body.summary !== undefined) data.summary = text(body.summary, 500);
  if (body.description !== undefined) data.description = text(body.description, 10000);
  if (body.price !== undefined) data.price = parsePrice(body.price);
  if (body.image !== undefined) data.image = text(body.image, 500);
  if (body.images !== undefined) data.images = sanitizeExtraImages(body.images);
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
  if (body.sortOrder !== undefined) data.sortOrder = parseInt(body.sortOrder) || 0;
  if (body.customFields !== undefined) data.customFields = sanitizeCustomFields(body.customFields);
  if (body.poseOptions !== undefined) data.poseOptions = sanitizePoseOptions(body.poseOptions);
  return data;
};

// Aktif ürünün fiyatı olmalı; poz seçimli üründe en az bir alette fotoğraflı poz olmalı
const assertSellable = (product) => {
  if (!product.isActive) return;
  if (!(product.price > 0)) throw new AppError("Ürünü aktif yapmak için fiyat girin", 400);
  if (usesPoses(product) && selectableApparatuses(product).length === 0) {
    throw new AppError("Poz fotoğrafı yüklenmeden satışa açılamaz", 400);
  }
};

// Kaldırılan poz görselleri R2'den silinir — bir siparişte seçilmiş olanlar kalır (admin görsün)
const cleanupPoseImages = async (oldOpts, newOpts) => {
  const keep = poseImageKeys(newOpts);
  for (const key of poseImageKeys(oldOpts)) {
    if (keep.has(key)) continue;
    const used = await prisma.shopOrder.count({ where: { selection: { path: ["poseImage"], equals: key } } });
    if (used === 0) {
      await deleteObject(key).catch((err) => console.error(`[r2] Poz görseli silinemedi (${key}):`, err.message));
    }
  }
};

const cleanupImage = (oldImage, newImage) => {
  if (oldImage?.startsWith(IMAGE_PREFIX) && oldImage !== newImage) {
    deleteObject(oldImage).catch((err) => console.error(`[r2] Ürün görseli silinemedi (${oldImage}):`, err.message));
  }
};

// Listeden çıkarılan ek fotoğraflar R2'den silinir (kapak olarak hâlâ kullanılan hariç)
const cleanupExtraImages = (oldList = [], newList = [], cover = null) => {
  const keep = new Set([...newList, cover]);
  for (const key of oldList) if (!keep.has(key)) cleanupImage(key, null);
};

export const createProduct = async (req, res) => {
  const data = productData(req.body ?? {}, { partial: false });
  const customFields = data.customFields ?? [];
  const translations = sanitizeProductTranslations(req.body?.translations, customFields) ?? {};
  assertSellable({ ...data, isActive: data.isActive ?? false });
  const product = await prisma.shopProduct
    .create({ data: { ...data, customFields, translations } })
    .catch(rethrowPrismaError(PRODUCT_NOT_FOUND));
  res.status(201).json({ message: "Ürün eklendi", product: formatAdminProduct(product) });
};

export const updateProduct = async (req, res) => {
  const existing = await prisma.shopProduct.findUnique({ where: { id: String(req.params.id) } });
  if (!existing) throw new AppError("Ürün bulunamadı", 404);
  const data = productData(req.body ?? {}, { partial: true });
  const customFields = data.customFields ?? existing.customFields ?? [];
  const translations = sanitizeProductTranslations(req.body?.translations, customFields);
  if (translations !== undefined) data.translations = translations;
  assertSellable({ ...existing, ...data });

  const product = await prisma.shopProduct
    .update({ where: { id: existing.id }, data })
    .catch(rethrowPrismaError(PRODUCT_NOT_FOUND));
  if (data.image !== undefined && !(product.images ?? []).includes(existing.image)) {
    cleanupImage(existing.image, product.image);
  }
  if (data.images !== undefined) cleanupExtraImages(existing.images, product.images, product.image);
  if (data.poseOptions !== undefined) {
    cleanupPoseImages(existing.poseOptions, product.poseOptions).catch((err) =>
      console.error("[r2] Poz görseli temizliği:", err.message)
    );
  }
  res.json({ message: "Ürün güncellendi", product: formatAdminProduct(product) });
};

// Siparişi olan ürün silinmez, pasife alınır (sipariş kayıtları ürüne bağlı kalsın)
export const deleteProduct = async (req, res) => {
  const product = await prisma.shopProduct.findUnique({
    where: { id: String(req.params.id) },
    include: { _count: { select: { orders: true } } },
  });
  if (!product) throw new AppError("Ürün bulunamadı", 404);
  if (product._count.orders > 0) {
    await prisma.shopProduct.update({ where: { id: product.id }, data: { isActive: false } });
    return res.json({ message: "Ürünün siparişleri olduğu için silinmedi, satıştan kaldırıldı", deactivated: true });
  }
  await prisma.shopProduct.delete({ where: { id: product.id } });
  cleanupImage(product.image, null);
  cleanupExtraImages(product.images, [], null);
  cleanupPoseImages(product.poseOptions, null).catch(() => {});
  res.json({ message: "Ürün silindi", deactivated: false });
};

export const presignProductImage = async (req, res) => {
  const { contentType, size } = req.body ?? {};
  const ext = String(contentType || "").split("/")[1]?.toLowerCase();
  if (!String(contentType).startsWith("image/") || !IMAGE_EXTENSIONS.has(ext)) {
    throw new AppError("Sadece jpg, png veya webp yüklenebilir", 400);
  }
  if (size && size > MAX_IMAGE_SIZE) throw new AppError("Görsel 10MB'ı aşamaz", 400);
  const key = `${IMAGE_PREFIX}${crypto.randomUUID()}.${ext === "jpeg" ? "jpg" : ext}`;
  res.json({ key, uploadUrl: await presignUpload(key, contentType) });
};

// ---------------------------------------------------------------------------
// Admin: siparişler
// ---------------------------------------------------------------------------
const formatAdminOrder = (o) => ({
  ...formatOrder(o),
  adminNote: o.adminNote,
  paymentId: o.paymentId,
  locale: o.locale,
  updatedAt: o.updatedAt,
  user: o.user ? { id: o.user.id, name: o.user.name, email: o.user.email } : null,
});

// status: "paid" (varsayılan) | "unpaid" | "all" | tek bir durum kodu
const statusWhere = (status) => {
  if (!status || status === "paid") return { status: { in: PAID_STATUSES } };
  if (status === "unpaid") return { status: { in: UNPAID_STATUSES } };
  if (status === "all") return {};
  if (SHOP_STATUSES.includes(status)) return { status };
  throw new AppError("Geçersiz durum", 400);
};

export const listOrdersAdmin = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const search = req.query.search ? String(req.query.search).trim().slice(0, 100) : "";
  const where = {
    ...statusWhere(req.query.status),
    ...(search && {
      OR: [
        { recipientName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { productName: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { id: search },
      ],
    }),
  };

  const [orders, total, grouped] = await Promise.all([
    prisma.shopOrder.findMany({
      where,
      // Ödenenler: en eski ödeme üstte değil, en yeni üstte
      orderBy: [{ paidAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, name: true, email: true } }, product: { select: { image: true } } },
    }),
    prisma.shopOrder.count({ where }),
    prisma.shopOrder.groupBy({ by: ["status"], _count: true }),
  ]);
  const counts = Object.fromEntries(SHOP_STATUSES.map((s) => [s, 0]));
  for (const g of grouped) counts[g.status] = g._count;

  res.json({
    data: orders.map(formatAdminOrder),
    counts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

export const updateOrderAdmin = async (req, res) => {
  const order = await prisma.shopOrder.findUnique({ where: { id: String(req.params.id) } });
  if (!order) throw new AppError(ORDER_NOT_FOUND, 404);
  const body = req.body ?? {};
  const data = {};

  if (body.status !== undefined) {
    if (!SHOP_STATUSES.includes(body.status)) throw new AppError("Geçersiz durum", 400);
    data.status = body.status;
    const now = new Date();
    // Elle "ödendi" (ör. havale) işaretlenirse ödeme zamanı da yazılır
    if (PAID_STATUSES.includes(body.status) && !order.paidAt) data.paidAt = now;
    if (body.status === "SHIPPED" && !order.shippedAt) data.shippedAt = now;
    if (body.status === "DELIVERED" && !order.deliveredAt) data.deliveredAt = now;
  }
  if (body.trackingInfo !== undefined) data.trackingInfo = text(body.trackingInfo, 300);
  if (body.adminNote !== undefined) data.adminNote = text(body.adminNote, 2000);
  if (body.shipping !== undefined) Object.assign(data, validateShipping({ ...order, ...body.shipping }));
  if (Object.keys(data).length === 0) throw new AppError("Güncellenecek alan yok", 400);

  const updated = await prisma.shopOrder.update({
    where: { id: order.id },
    data,
    include: { user: { select: { id: true, name: true, email: true } }, product: { select: { image: true } } },
  });

  // Kargoya verildi / teslim edildi: müşteriye bir kez haber ver
  const notify =
    (data.status === "SHIPPED" && order.status !== "SHIPPED" && !order.shippedAt) ||
    (data.status === "DELIVERED" && order.status !== "DELIVERED" && !order.deliveredAt);
  if (notify && updated.user?.email && body.notify !== false) {
    sendShopOrderStatusEmail(updated.user.email, updated);
  }
  res.json({ message: "Sipariş güncellendi", order: formatAdminOrder(updated) });
};

// Yalnızca hiç ödenmemiş sipariş silinebilir (ödenmiş kayıt muhasebe kaydıdır; iptal edilir)
export const deleteOrderAdmin = async (req, res) => {
  const order = await prisma.shopOrder.findUnique({ where: { id: String(req.params.id) } });
  if (!order) throw new AppError(ORDER_NOT_FOUND, 404);
  if (order.paidAt || PAID_STATUSES.includes(order.status)) {
    throw new AppError("Ödenmiş sipariş silinemez; durumunu İptal yapın", 400);
  }
  await prisma.shopOrder.delete({ where: { id: order.id } });
  res.json({ message: "Sipariş silindi" });
};
