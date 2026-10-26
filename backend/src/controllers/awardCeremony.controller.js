import crypto from "node:crypto";
import prisma from "../lib/prisma.js";
import { AppError, rethrowPrismaError } from "../utils/errors.js";
import { slugify } from "../utils/slugify.js";
import { localize, sanitizeTranslations } from "../utils/i18n.js";
import {
  assertUploadBatch,
  validateUploadFile,
  fileRecordFields,
  streamZip,
  zipFileName,
  zipManifest,
  presignVariants,
  variantRecordFields,
  mediaViewFields,
  parseQuality,
  downloadTarget,
  downloadSizes,
  deleteMediaObjects,
  MISSING_PREVIEW_BATCH,
  missingPreviewWhere,
  missingPreviewItems,
  savePreviews,
  deleteAllMedia,
  deleteMediaFiles,
  ORIGINAL_DIR,
  parseSelectedIds,
} from "../utils/uploads.js";
import {
  presignUpload,
  presignView,
  presignDownload,
} from "../lib/r2.js";

// Ödül töreni galerileri HERKESE AÇIK: giriş gerekmez. Bucket yine private kalır —
// dosyalar müşteri galerisindeki gibi presigned URL'lerle sunulur.

const CEREMONY_NOT_FOUND = { notFound: "Ödül töreni bulunamadı" };
const TEXT_FIELDS = ["title", "description", "date", "location"];
const TRANSLATION_FIELDS = { stringFields: TEXT_FIELDS };

const optionalText = (value, max) => {
  const trimmed = value ? String(value).trim().slice(0, max) : "";
  return trimmed || null;
};

// R2'de insan-okunur klasör: odul-torenleri/{slug}_{id}/ — id sahiplik doğrulaması için şart.
// Slug oluşturulduktan sonra değişmediği için prefix de sabit kalır.
const buildCeremonyPrefix = (ceremony) => `odul-torenleri/${ceremony.slug}_${ceremony.id}/`;

// Başlıktan benzersiz slug: çakışırsa -2, -3 ... eklenir
const uniqueSlug = async (title) => {
  const base = slugify(title, 60) || "odul-toreni";
  const taken = await prisma.awardCeremony.findMany({
    where: { slug: { startsWith: base } },
    select: { slug: true },
  });
  // "admin"/"photos" route segmentleriyle çakışmasın
  const takenSet = new Set(["admin", "photos", ...taken.map((c) => c.slug)]);
  if (!takenSet.has(base)) return base;
  let n = 2;
  while (takenSet.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
};

const findCeremony = async (where) => {
  const ceremony = await prisma.awardCeremony.findUnique({ where });
  if (!ceremony) throw new AppError(CEREMONY_NOT_FOUND.notFound, 404);
  return ceremony;
};

// locale verilirse metinler o dile çevrilir (admin: çevrilmemiş + translations)
const formatCeremony = (raw, locale) => {
  const c = localize(raw, locale, TEXT_FIELDS);
  return {
  id: c.id,
  slug: c.slug,
  title: c.title,
  description: c.description,
  date: c.date,
  location: c.location,
  sortOrder: c.sortOrder,
  createdAt: c.createdAt,
  translations: raw.translations ?? {},
  };
};

// Bir törenin dosyaları, presigned URL'lerle ve sayfalı
const listCeremonyPhotos = async (ceremonyId, query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(query.limit) || 60));
  const type = ["image", "video"].includes(query.type) ? query.type : undefined;

  const where = {
    ceremonyId,
    ...(type && { contentType: { startsWith: `${type}/` } }),
  };

  const [photos, total, sizes] = await Promise.all([
    prisma.awardPhoto.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.awardPhoto.count({ where }),
    downloadSizes(prisma.awardPhoto, { ceremonyId }),
  ]);

  // Presign lokal HMAC hesabı — network çağrısı yok, toplu üretim ucuz
  const data = await Promise.all(
    photos.map(async (p) => ({
      id: p.id,
      fileName: p.fileName,
      size: p.size,
      contentType: p.contentType,
      createdAt: p.createdAt,
      ...(await mediaViewFields(p)),
    }))
  );

  return {
    data,
    downloadSizes: sizes,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

// Public: tören kartları (kapak = ilk yüklenen fotoğraf)
export const getAllCeremonies = async (req, res) => {
  const ceremonies = await prisma.awardCeremony.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { photos: true } },
      photos: {
        where: { contentType: { startsWith: "image/" } },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { r2Key: true, previewKey: true },
      },
    },
  });

  const data = await Promise.all(
    ceremonies.map(async (c) => ({
      ...formatCeremony(c, req.locale),
      photoCount: c._count.photos,
      coverUrl: c.photos[0]
        ? await presignView(c.photos[0].previewKey ?? c.photos[0].r2Key)
        : null,
    }))
  );

  res.json(data);
};

// Public: tek tören + dosyaları
export const getCeremonyBySlug = async (req, res) => {
  const ceremony = await findCeremony({ slug: req.params.slug });
  res.json({
    ceremony: formatCeremony(ceremony, req.locale),
    ...(await listCeremonyPhotos(ceremony.id, req.query)),
  });
};

// Public: tek dosya indirme URL'i
export const downloadCeremonyPhoto = async (req, res) => {
  const photo = await prisma.awardPhoto.findUnique({
    where: { id: req.params.photoId },
    include: { ceremony: { select: { slug: true } } },
  });
  if (!photo || photo.ceremony.slug !== req.params.slug) {
    throw new AppError("Fotoğraf bulunamadı", 404);
  }
  const target = downloadTarget(photo, parseQuality(req.query.quality));
  res.json({ url: await presignDownload(target.key, target.fileName) });
};

// Toplu indirilecek dosyalar
// ids: seçilenler (POST). Yalnızca bu törenin dosyaları dönebilir.
const findCeremonyZipPhotos = async (slug, ids = null) => {
  const ceremony = await findCeremony({ slug });
  const photos = await prisma.awardPhoto.findMany({
    where: { ceremonyId: ceremony.id, ...(ids && { id: { in: ids } }) },
    orderBy: { createdAt: "asc" },
  });
  if (photos.length === 0) {
    throw new AppError("İndirilecek dosya bulunamadı", 404);
  }
  return { photos, zipName: zipFileName(ceremony.title, "odul-toreni") };
};

// Public: tarayıcıda zip için dosya listesi (asıl yol — dosyalar doğrudan R2'den iner)
export const getCeremonyZipManifest = async (req, res) => {
  const { photos, zipName } = await findCeremonyZipPhotos(req.params.slug, parseSelectedIds(req.body));
  res.json(await zipManifest(photos, zipName, undefined, parseQuality(req.query.quality)));
};

// Public: sunucuda zip (yedek yol: çok büyük galeri + tarayıcı kaldıramıyor)
export const downloadAllCeremonyPhotos = async (req, res) => {
  const { photos, zipName } = await findCeremonyZipPhotos(req.params.slug);
  await streamZip(res, photos, zipName, undefined, parseQuality(req.query.quality));
};

// Admin: tek tören (id ile — slug'dan bağımsız)
export const getCeremonyAdmin = async (req, res) => {
  const ceremony = await findCeremony({ id: req.params.id });
  const [list, missingPreviews] = await Promise.all([
    listCeremonyPhotos(ceremony.id, req.query),
    prisma.awardPhoto.count({ where: { ceremonyId: ceremony.id, ...missingPreviewWhere } }),
  ]);
  res.json({ ceremony: formatCeremony(ceremony), ...list, missingPreviews });
};

// Admin: yeni tören
export const createCeremony = async (req, res) => {
  const { title, description, date, location, sortOrder, translations } = req.body;
  const cleanTitle = optionalText(title, 150);
  if (!cleanTitle) {
    throw new AppError("Tören adı gerekli", 400);
  }

  const ceremony = await prisma.awardCeremony.create({
    data: {
      slug: await uniqueSlug(cleanTitle),
      title: cleanTitle,
      description: optionalText(description, 2000),
      date: optionalText(date, 100),
      location: optionalText(location, 150),
      sortOrder: Number.isInteger(sortOrder) ? sortOrder : 0,
      translations: sanitizeTranslations(translations, TRANSLATION_FIELDS) ?? {},
    },
  });

  res.status(201).json({ message: "Ödül töreni oluşturuldu", ceremony: formatCeremony(ceremony) });
};

// Admin: tören güncelle (kısmi). Slug bilerek değişmez — paylaşılmış linkler kırılmasın.
export const updateCeremony = async (req, res) => {
  const { title, description, date, location, sortOrder, translations } = req.body;

  if (title !== undefined && !optionalText(title, 150)) {
    throw new AppError("Tören adı boş olamaz", 400);
  }

  const ceremony = await prisma.awardCeremony
    .update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title: optionalText(title, 150) }),
        ...(description !== undefined && { description: optionalText(description, 2000) }),
        ...(date !== undefined && { date: optionalText(date, 100) }),
        ...(location !== undefined && { location: optionalText(location, 150) }),
        ...(Number.isInteger(sortOrder) && { sortOrder }),
        ...(translations !== undefined && {
          translations: sanitizeTranslations(translations, TRANSLATION_FIELDS),
        }),
      },
    })
    .catch(rethrowPrismaError(CEREMONY_NOT_FOUND));

  res.json({ message: "Ödül töreni güncellendi", ceremony: formatCeremony(ceremony) });
};

// Admin: tören sil. DB kayıtları cascade ile gider; R2 objeleri toplu silinir (1000'er,
// birkaç saniye) — arka plan döngüsü sunucu yeniden başlayınca yarıda kalıyordu.
export const deleteCeremony = async (req, res) => {
  const photos = await prisma.awardPhoto.findMany({
    where: { ceremonyId: req.params.id },
    select: { r2Key: true, thumbKey: true, previewKey: true },
  });

  await prisma.awardCeremony
    .delete({ where: { id: req.params.id } })
    .catch(rethrowPrismaError(CEREMONY_NOT_FOUND));

  await deleteMediaFiles(photos, "Tören");

  res.json({ message: "Ödül töreni silindi" });
};

// Admin: toplu yükleme için imzalı PUT URL'leri
export const presignCeremonyUploads = async (req, res) => {
  const { files } = req.body;
  assertUploadBatch(files);
  const ceremony = await findCeremony({ id: req.params.id });
  const prefix = buildCeremonyPrefix(ceremony);

  const results = await Promise.all(
    files.map(async (file) => {
      const ext = validateUploadFile(file);
      // Orijinal `…/orijinal/`, önizlemeleri `…/onizleme/` (bkz. utils/uploads.js variantKeys)
      const key = `${prefix}${ORIGINAL_DIR}/${crypto.randomUUID()}.${ext}`;
      return {
        key,
        fileName: file.fileName,
        uploadUrl: await presignUpload(key, file.contentType),
        ...(await presignVariants(key, file.contentType)),
      };
    })
  );

  res.json({ files: results });
};

// Admin: yüklenen dosyaları DB'ye kaydeder
export const confirmCeremonyUploads = async (req, res) => {
  const { files } = req.body;
  assertUploadBatch(files);
  const ceremony = await findCeremony({ id: req.params.id });
  const prefix = buildCeremonyPrefix(ceremony);

  // Key mutlaka bu törenin klasöründe olmalı (başka törene/müşteri klasörüne yazılamasın)
  const data = files.map((file) => {
    const key = file?.key;
    if (!key || !String(key).startsWith(prefix)) {
      throw new AppError("Geçersiz dosya anahtarı", 400);
    }
    return {
      ceremonyId: ceremony.id,
      r2Key: key,
      ...fileRecordFields(file),
      ...variantRecordFields(file, key),
    };
  });

  const result = await prisma.awardPhoto.createMany({ data, skipDuplicates: true });
  res.status(201).json({ message: "Fotoğraflar kaydedildi", count: result.count });
};

// Admin: tek dosya sil (önce R2, sonra DB — R2 silinemezse DB kaydı kalır)
export const deleteCeremonyPhoto = async (req, res) => {
  const photo = await prisma.awardPhoto.findUnique({ where: { id: req.params.photoId } });
  if (!photo) {
    throw new AppError("Fotoğraf bulunamadı", 404);
  }

  await deleteMediaObjects(photo);
  await prisma.awardPhoto
    .delete({ where: { id: photo.id } })
    .catch(rethrowPrismaError({ notFound: "Fotoğraf bulunamadı" }));

  res.json({ message: "Fotoğraf silindi" });
};

// Admin: önizlemesi olmayan eski fotoğraflar (tarayıcı önizleme üretsin diye, parça parça)
export const getCeremonyMissingPreviews = async (req, res) => {
  const ceremony = await findCeremony({ id: req.params.id });
  const where = { ceremonyId: ceremony.id, ...missingPreviewWhere };
  const [photos, remaining] = await Promise.all([
    prisma.awardPhoto.findMany({ where, orderBy: { createdAt: "asc" }, take: MISSING_PREVIEW_BATCH }),
    prisma.awardPhoto.count({ where }),
  ]);
  res.json({ remaining, files: await missingPreviewItems(photos) });
};

// Admin: tarayıcının yüklediği önizlemeleri kayda bağlar
export const saveCeremonyPreviews = async (req, res) => {
  const ceremony = await findCeremony({ id: req.params.id });
  const count = await savePreviews(prisma.awardPhoto, { ceremonyId: ceremony.id }, req.body?.files);
  res.json({ message: "Önizlemeler kaydedildi", count });
};

// Admin: törenin bütün dosyalarını siler; tören (adı, adresi) kalır
export const deleteAllCeremonyPhotos = async (req, res) => {
  const ceremony = await findCeremony({ id: req.params.id });
  const count = await deleteAllMedia(prisma.awardPhoto, { ceremonyId: ceremony.id });
  res.json({ message: "Fotoğraflar silindi", count });
};
