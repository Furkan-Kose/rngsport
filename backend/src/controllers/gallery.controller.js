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
  zipManifest,
} from "../utils/uploads.js";
import {
  presignUpload,
  presignView,
  presignDownload,
  deleteObject,
} from "../lib/r2.js";

const sanitizeAlbum = (value) => {
  const trimmed = value ? String(value).trim().slice(0, 100) : "";
  return trimmed || null;
};

// R2'de insan-okunur klasör: users/{isim-slug}_{userId}/{yarisma-slug}/
// userId yol içinde kalır — benzersizlik ve sahiplik doğrulaması için şart.
const buildUserPrefix = (user) =>
  `users/${slugify(user.name) || "kullanici"}_${user.id}/`;

const buildUploadKey = (user, album, ext) =>
  `${buildUserPrefix(user)}${slugify(album) || "genel"}/${crypto.randomUUID()}.${ext}`;

// Fotoğrafları presigned URL'lerle birlikte, sayfalı döner (getMyPhotos + admin listesi ortak)
const listPhotosForUser = async (userId, query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(query.limit) || 60));
  const album = query.album ? String(query.album).slice(0, 100) : undefined;
  // type=image|video → contentType prefix'ine göre filtre
  const type = ["image", "video"].includes(query.type) ? query.type : undefined;

  const where = {
    userId,
    ...(album && { album }),
    ...(type && { contentType: { startsWith: `${type}/` } }),
  };

  const [photos, total, albums] = await Promise.all([
    prisma.galleryPhoto.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.galleryPhoto.count({ where }),
    prisma.galleryPhoto.findMany({
      where: { userId, album: { not: null } },
      select: { album: true },
      distinct: ["album"],
      orderBy: { album: "asc" },
    }),
  ]);

  // Presign lokal HMAC hesabı — network çağrısı yok, toplu üretim ucuz
  const data = await Promise.all(
    photos.map(async (p) => ({
      id: p.id,
      fileName: p.fileName,
      album: p.album,
      size: p.size,
      contentType: p.contentType,
      createdAt: p.createdAt,
      url: await presignView(p.r2Key),
    }))
  );

  return {
    data,
    albums: albums.map((a) => a.album),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

// Girişli kullanıcının kendi galerisi
export const getMyPhotos = async (req, res) => {
  res.json(await listPhotosForUser(req.user.id, req.query));
};

// Toplu indirilecek dosyalar (tüm galeri veya bir albüm)
const findMyZipPhotos = async (req) => {
  const album = req.query.album ? String(req.query.album).slice(0, 100) : undefined;
  const photos = await prisma.galleryPhoto.findMany({
    where: { userId: req.user.id, ...(album && { album }) },
    orderBy: { createdAt: "asc" },
  });
  if (photos.length === 0) {
    throw new AppError("İndirilecek dosya bulunamadı", 404);
  }
  const zipName = album ? zipFileName(album, "galeri") : "rngsport-galerim.zip";
  return { photos, zipName };
};

// Tarayıcıda zip için dosya listesi (asıl yol — dosyalar doğrudan R2'den iner)
export const getMyZipManifest = async (req, res) => {
  const { photos, zipName } = await findMyZipPhotos(req);
  // Albümler zip içinde klasör olur
  res.json(await zipManifest(photos, zipName, (photo) => photo.album));
};

// Sunucuda zip (yedek yol: tarayıcının kaldıramayacağı kadar büyük galeriler)
export const downloadAllMyPhotos = async (req, res) => {
  const { photos, zipName } = await findMyZipPhotos(req);
  await streamZip(res, photos, zipName, (photo) => photo.album);
};

// Tek fotoğraf için indirme URL'i (sahiplik kontrolü)
export const downloadMyPhoto = async (req, res) => {
  const photo = await prisma.galleryPhoto.findUnique({
    where: { id: req.params.id },
  });

  if (!photo) {
    throw new AppError("Fotoğraf bulunamadı", 404);
  }
  if (photo.userId !== req.user.id && req.user.role !== "admin") {
    throw new AppError("Bu fotoğrafa erişim yetkiniz yok", 403);
  }

  res.json({ url: await presignDownload(photo.r2Key, photo.fileName) });
};

// Admin: toplu yükleme için imzalı PUT URL'leri üretir
export const presignPhotoUploads = async (req, res) => {
  const { userId, album, files } = req.body;

  if (!userId) {
    throw new AppError("Kullanıcı gerekli", 400);
  }
  assertUploadBatch(files);

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
  if (!user) {
    throw new AppError("Kullanıcı bulunamadı", 404);
  }

  const results = await Promise.all(
    files.map(async (file) => {
      const ext = validateUploadFile(file);
      const key = buildUploadKey(user, album, ext);
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
export const confirmPhotoUploads = async (req, res) => {
  const { userId, album, files } = req.body;

  if (!userId || !Array.isArray(files) || files.length === 0) {
    throw new AppError("Kullanıcı ve dosya listesi gerekli", 400);
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
  if (!user) {
    throw new AppError("Kullanıcı bulunamadı", 404);
  }

  // Cross-user injection engeli: key mutlaka bu kullanıcının klasörüyle başlamalı.
  // Eski (users/{id}/...) ve yeni (users/{isim}_{id}/...) şemaların ikisi de kabul edilir.
  const validPrefixes = [buildUserPrefix(user), `users/${userId}/`];
  const data = files.map((file) => {
    const key = file?.key;
    if (!key || !validPrefixes.some((prefix) => String(key).startsWith(prefix))) {
      throw new AppError("Geçersiz dosya anahtarı", 400);
    }
    return {
      userId,
      r2Key: key,
      album: sanitizeAlbum(album),
      ...fileRecordFields(file),
    };
  });

  const result = await prisma.galleryPhoto.createMany({ data, skipDuplicates: true });

  res.status(201).json({ message: "Fotoğraflar kaydedildi", count: result.count });
};

// Admin: bir kullanıcının galerisi
export const getUserPhotosAdmin = async (req, res) => {
  res.json(await listPhotosForUser(req.params.userId, req.query));
};

// Admin: fotoğraf sil (önce R2, sonra DB — R2 silinemezse DB kaydı kalır)
export const deletePhoto = async (req, res) => {
  const photo = await prisma.galleryPhoto.findUnique({
    where: { id: req.params.id },
  });

  if (!photo) {
    throw new AppError("Fotoğraf bulunamadı", 404);
  }

  await deleteObject(photo.r2Key);
  await prisma.galleryPhoto
    .delete({ where: { id: photo.id } })
    .catch(rethrowPrismaError({ notFound: "Fotoğraf bulunamadı" }));

  res.json({ message: "Fotoğraf silindi" });
};
