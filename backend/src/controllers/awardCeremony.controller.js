import crypto from "node:crypto";
import prisma from "../lib/prisma.js";
import { AppError, rethrowPrismaError } from "../utils/errors.js";
import { slugify } from "../utils/slugify.js";
import {
  assertUploadBatch,
  validateUploadFile,
  fileRecordFields,
  streamZip,
  zipFileName,
} from "../utils/uploads.js";
import {
  presignUpload,
  presignView,
  presignDownload,
  deleteObject,
} from "../lib/r2.js";

// Ödül töreni galerileri HERKESE AÇIK: giriş gerekmez. Bucket yine private kalır —
// dosyalar müşteri galerisindeki gibi presigned URL'lerle sunulur.

const CEREMONY_NOT_FOUND = { notFound: "Ödül töreni bulunamadı" };

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

const formatCeremony = (c) => ({
  id: c.id,
  slug: c.slug,
  title: c.title,
  description: c.description,
  date: c.date,
  location: c.location,
  sortOrder: c.sortOrder,
  createdAt: c.createdAt,
});

// Bir törenin dosyaları, presigned URL'lerle ve sayfalı
const listCeremonyPhotos = async (ceremonyId, query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(query.limit) || 60));
  const type = ["image", "video"].includes(query.type) ? query.type : undefined;

  const where = {
    ceremonyId,
    ...(type && { contentType: { startsWith: `${type}/` } }),
  };

  const [photos, total] = await Promise.all([
    prisma.awardPhoto.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.awardPhoto.count({ where }),
  ]);

  // Presign lokal HMAC hesabı — network çağrısı yok, toplu üretim ucuz
  const data = await Promise.all(
    photos.map(async (p) => ({
      id: p.id,
      fileName: p.fileName,
      size: p.size,
      contentType: p.contentType,
      createdAt: p.createdAt,
      url: await presignView(p.r2Key),
    }))
  );

  return {
    data,
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
        select: { r2Key: true },
      },
    },
  });

  const data = await Promise.all(
    ceremonies.map(async (c) => ({
      ...formatCeremony(c),
      photoCount: c._count.photos,
      coverUrl: c.photos[0] ? await presignView(c.photos[0].r2Key) : null,
    }))
  );

  res.json(data);
};

// Public: tek tören + dosyaları
export const getCeremonyBySlug = async (req, res) => {
  const ceremony = await findCeremony({ slug: req.params.slug });
  res.json({
    ceremony: formatCeremony(ceremony),
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
  res.json({ url: await presignDownload(photo.r2Key, photo.fileName) });
};

// Public: törenin tüm dosyaları zip olarak
export const downloadAllCeremonyPhotos = async (req, res) => {
  const ceremony = await findCeremony({ slug: req.params.slug });
  const photos = await prisma.awardPhoto.findMany({
    where: { ceremonyId: ceremony.id },
    orderBy: { createdAt: "asc" },
  });
  if (photos.length === 0) {
    throw new AppError("İndirilecek dosya bulunamadı", 404);
  }
  await streamZip(res, photos, zipFileName(ceremony.title, "odul-toreni"));
};

// Admin: tek tören (id ile — slug'dan bağımsız)
export const getCeremonyAdmin = async (req, res) => {
  const ceremony = await findCeremony({ id: req.params.id });
  res.json({
    ceremony: formatCeremony(ceremony),
    ...(await listCeremonyPhotos(ceremony.id, req.query)),
  });
};

// Admin: yeni tören
export const createCeremony = async (req, res) => {
  const { title, description, date, location, sortOrder } = req.body;
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
    },
  });

  res.status(201).json({ message: "Ödül töreni oluşturuldu", ceremony: formatCeremony(ceremony) });
};

// Admin: tören güncelle (kısmi). Slug bilerek değişmez — paylaşılmış linkler kırılmasın.
export const updateCeremony = async (req, res) => {
  const { title, description, date, location, sortOrder } = req.body;

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
      },
    })
    .catch(rethrowPrismaError(CEREMONY_NOT_FOUND));

  res.json({ message: "Ödül töreni güncellendi", ceremony: formatCeremony(ceremony) });
};

// Admin: tören sil. DB kayıtları cascade ile gider; R2 objeleri arka planda temizlenir
// (yüzlerce dosya olabilir — response'u bekletmesin).
export const deleteCeremony = async (req, res) => {
  const photos = await prisma.awardPhoto.findMany({
    where: { ceremonyId: req.params.id },
    select: { r2Key: true },
  });

  await prisma.awardCeremony
    .delete({ where: { id: req.params.id } })
    .catch(rethrowPrismaError(CEREMONY_NOT_FOUND));

  (async () => {
    for (const { r2Key } of photos) {
      await deleteObject(r2Key).catch((err) =>
        console.error(`[r2] Tören dosyası silinemedi (${r2Key}):`, err.message)
      );
    }
  })();

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
      const key = `${prefix}${crypto.randomUUID()}.${ext}`;
      return {
        key,
        fileName: file.fileName,
        uploadUrl: await presignUpload(key, file.contentType),
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
    return { ceremonyId: ceremony.id, r2Key: key, ...fileRecordFields(file) };
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

  await deleteObject(photo.r2Key);
  await prisma.awardPhoto
    .delete({ where: { id: photo.id } })
    .catch(rethrowPrismaError({ notFound: "Fotoğraf bulunamadı" }));

  res.json({ message: "Fotoğraf silindi" });
};
