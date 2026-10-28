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
  ORIGINAL_DIR,
  parseSelectedIds,
} from "../utils/uploads.js";
import { presignUpload, presignDownload } from "../lib/r2.js";

const sanitizeAlbum = (value) => {
  const trimmed = value ? String(value).trim().slice(0, 100) : "";
  return trimmed || null;
};

// R2'de insan-okunur klasör: users/{isim-slug}_{userId}/{yarisma-slug}/
// userId yol içinde kalır — benzersizlik ve sahiplik doğrulaması için şart.
const buildUserPrefix = (user) =>
  `users/${slugify(user.name) || "kullanici"}_${user.id}/`;

// Orijinal `…/{albüm}/orijinal/`, önizlemeleri `…/{albüm}/onizleme/` (bkz. utils/uploads.js variantKeys)
const buildUploadKey = (user, album, ext) =>
  `${buildUserPrefix(user)}${slugify(album) || "genel"}/${ORIGINAL_DIR}/${crypto.randomUUID()}.${ext}`;

// Fotoğrafları presigned URL'lerle birlikte, sayfalı döner (getMyPhotos + admin listesi ortak)
// fixedAlbum: paylaşım linki tek albüme aitse sorgudaki albüm yok sayılır
const listPhotosForUser = async (userId, query, { fixedAlbum = null } = {}) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(query.limit) || 60));
  const album = fixedAlbum ?? (query.album ? String(query.album).slice(0, 100) : undefined);
  // type=image|video → contentType prefix'ine göre filtre
  const type = ["image", "video"].includes(query.type) ? query.type : undefined;

  const where = {
    userId,
    ...(album && { album }),
    ...(type && { contentType: { startsWith: `${type}/` } }),
  };

  const [photos, total, albums, sizes] = await Promise.all([
    prisma.galleryPhoto.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.galleryPhoto.count({ where }),
    fixedAlbum
      ? [{ album: fixedAlbum }]
      : prisma.galleryPhoto.findMany({
          where: { userId, album: { not: null } },
          select: { album: true },
          distinct: ["album"],
          orderBy: { album: "asc" },
        }),
    downloadSizes(prisma.galleryPhoto, { userId, ...(album && { album }) }),
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
      ...(await mediaViewFields(p)),
    }))
  );

  return {
    data,
    albums: albums.map((a) => a.album),
    downloadSizes: sizes,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

// ---------------------------------------------------------------------------
// İndirme kaydı (admin "kim indirdi" görsün). Beklemeden yazılır: hata indirmeyi bozmaz.
// Aynı kapsam 10 dk içinde tekrar istenirse (imzalı link süresi doldu, yeniden deneme,
// galeriye kaydetme turları) yeni satır açılmaz. Admin'in kendi indirmesi sayılmaz.
// ---------------------------------------------------------------------------
const DOWNLOAD_DEDUPE_MS = 10 * 60 * 1000;

const logDownload = (entry) => {
  const data = { selected: false, album: null, photoId: null, fileName: null, shareId: null, fileCount: 1, ...entry };
  prisma.galleryDownload
    .findFirst({
      where: {
        userId: data.userId,
        shareId: data.shareId,
        kind: data.kind,
        selected: data.selected,
        album: data.album,
        photoId: data.photoId,
        quality: data.quality,
        fileCount: data.fileCount,
        createdAt: { gt: new Date(Date.now() - DOWNLOAD_DEDUPE_MS) },
      },
      select: { id: true },
    })
    .then((recent) => recent || prisma.galleryDownload.create({ data }))
    .catch((err) => console.error("İndirme kaydı yazılamadı:", err.message));
};

const zipLog = (photos, manifestOrNull, { userId, shareId = null, album, selected, quality, kind }) =>
  logDownload({
    userId,
    shareId,
    kind,
    selected,
    album: album ?? null,
    fileCount: photos.length,
    totalSize: manifestOrNull?.totalSize ?? photos.reduce((sum, p) => sum + (p.size || 0), 0),
    quality,
  });

// ?purpose=save → telefonda "Galeriye kaydet" (tek dosya linkiyle çalışır)
const singleKind = (query) => (query.purpose === "save" ? "save" : "single");

const singleLog = (photo, target, req, shareId = null) =>
  logDownload({
    userId: photo.userId,
    shareId,
    kind: singleKind(req.query),
    album: photo.album,
    photoId: photo.id,
    fileName: photo.fileName,
    totalSize: target.size,
    quality: parseQuality(req.query.quality),
  });

// Girişli kullanıcının kendi galerisi
export const getMyPhotos = async (req, res) => {
  res.json(await listPhotosForUser(req.user.id, req.query));
};

// Toplu indirilecek dosyalar (tüm galeri veya bir albüm)
// Seçili dosyalar (POST ids) da yalnızca kullanıcının kendi galerisinden gelir
const findMyZipPhotos = async (req) => {
  const album = req.query.album ? String(req.query.album).slice(0, 100) : undefined;
  const ids = parseSelectedIds(req.body);
  const photos = await prisma.galleryPhoto.findMany({
    where: { userId: req.user.id, ...(album && { album }), ...(ids && { id: { in: ids } }) },
    orderBy: { createdAt: "asc" },
  });
  if (photos.length === 0) {
    throw new AppError("İndirilecek dosya bulunamadı", 404);
  }
  const zipName = album ? zipFileName(album, "galeri") : "rngsport-galerim.zip";
  return { photos, zipName, album, selected: !!ids };
};

// Tarayıcıda zip için dosya listesi (asıl yol — dosyalar doğrudan R2'den iner)
export const getMyZipManifest = async (req, res) => {
  const { photos, zipName, album, selected } = await findMyZipPhotos(req);
  const quality = parseQuality(req.query.quality);
  // Albümler zip içinde klasör olur
  const manifest = await zipManifest(photos, zipName, (photo) => photo.album, quality);
  if (req.user.role !== "admin") {
    zipLog(photos, manifest, { userId: req.user.id, album, selected, quality, kind: "zip" });
  }
  res.json(manifest);
};

// Sunucuda zip (yedek yol: tarayıcının kaldıramayacağı kadar büyük galeriler)
export const downloadAllMyPhotos = async (req, res) => {
  const { photos, zipName, album, selected } = await findMyZipPhotos(req);
  const quality = parseQuality(req.query.quality);
  if (req.user.role !== "admin") {
    zipLog(photos, null, { userId: req.user.id, album, selected, quality, kind: "server-zip" });
  }
  await streamZip(res, photos, zipName, (photo) => photo.album, quality);
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

  const target = downloadTarget(photo, parseQuality(req.query.quality));
  const url = await presignDownload(target.key, target.fileName);
  if (photo.userId === req.user.id) singleLog(photo, target, req);
  res.json({ url });
};

// ---------------------------------------------------------------------------
// Paylaşım linki (/paylasim/:token). Ziyaretçi yalnızca linkin kapsamındaki dosyaları
// görür ve indirir: hesap bilgisi, profil, siparişler ASLA dönmez. Sunucu zip'i
// (download-all) bilerek YOK — toplu indirme tarayıcıda, doğrudan R2'den (Railway trafiği yok).
// ---------------------------------------------------------------------------
const SHARE_DAYS = 30;
const SHARE_INVALID = "Paylaşım linki geçersiz veya süresi dolmuş";
const activeShareWhere = () => ({ revokedAt: null, expiresAt: { gt: new Date() } });
const shareAlbum = (value) => (value ? String(value).slice(0, 100) : null);
const shareView = (s) => ({ id: s.id, token: s.token, album: s.album, createdAt: s.createdAt, expiresAt: s.expiresAt });

// Müşteri: aktif paylaşım linkleri (galeride "Paylaşım açık" göstermek için)
export const getMyShares = async (req, res) => {
  const shares = await prisma.galleryShare.findMany({
    where: { userId: req.user.id, ...activeShareWhere() },
    orderBy: { createdAt: "desc" },
  });
  res.json({ data: shares.map(shareView) });
};

// Müşteri: paylaş — bu kapsamda aktif link varsa AYNISI döner, yoksa 30 günlük yeni link
export const createMyShare = async (req, res) => {
  const album = shareAlbum(req.body?.album);
  const existing = await prisma.galleryShare.findFirst({
    where: { userId: req.user.id, album, ...activeShareWhere() },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return res.json({ share: shareView(existing), created: false });

  const count = await prisma.galleryPhoto.count({ where: { userId: req.user.id, ...(album && { album }) } });
  if (count === 0) throw new AppError("Paylaşılacak dosya yok", 400);

  const share = await prisma.galleryShare.create({
    data: {
      token: crypto.randomBytes(24).toString("base64url"),
      userId: req.user.id,
      album,
      expiresAt: new Date(Date.now() + SHARE_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  res.status(201).json({ message: "Paylaşım linki oluşturuldu", share: shareView(share), created: true });
};

// Müşteri: paylaşımı kapat (link hemen çalışmaz olur)
export const revokeMyShare = async (req, res) => {
  const { count } = await prisma.galleryShare.updateMany({
    where: { id: req.params.id, userId: req.user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (count === 0) throw new AppError("Paylaşım bulunamadı", 404);
  res.json({ message: "Paylaşım kapatıldı" });
};

const findActiveShare = async (token) => {
  if (typeof token !== "string" || token.length < 20 || token.length > 64) throw new AppError(SHARE_INVALID, 404);
  const share = await prisma.galleryShare.findUnique({ where: { token } });
  if (!share || share.revokedAt || share.expiresAt <= new Date()) throw new AppError(SHARE_INVALID, 404);
  return share;
};

// Linkin kapsamı: sahibinin galerisi, link tek albümse yalnızca o albüm
const shareScope = (share) => ({ userId: share.userId, ...(share.album && { album: share.album }) });

// Public: paylaşılan galeri (sayfalı)
export const getSharedGallery = async (req, res) => {
  const share = await findActiveShare(req.params.token);
  const list = await listPhotosForUser(share.userId, req.query, { fixedAlbum: share.album });
  res.json({ ...list, share: { album: share.album, expiresAt: share.expiresAt } });
};

// Public: tarayıcıda zip için dosya listesi (tümü / albüm / seçilenler)
export const getSharedZipManifest = async (req, res) => {
  const share = await findActiveShare(req.params.token);
  const album = share.album ?? (req.query.album ? String(req.query.album).slice(0, 100) : undefined);
  const ids = parseSelectedIds(req.body);
  const photos = await prisma.galleryPhoto.findMany({
    where: { ...shareScope(share), ...(album && { album }), ...(ids && { id: { in: ids } }) },
    orderBy: { createdAt: "asc" },
  });
  if (photos.length === 0) throw new AppError("İndirilecek dosya bulunamadı", 404);
  const zipName = album ? zipFileName(album, "galeri") : "rngsport-galeri.zip";
  const quality = parseQuality(req.query.quality);
  const manifest = await zipManifest(photos, zipName, (photo) => photo.album, quality);
  zipLog(photos, manifest, { userId: share.userId, shareId: share.id, album, selected: !!ids, quality, kind: "zip" });
  res.json(manifest);
};

// Public: tek dosya indirme linki (yalnızca linkin kapsamındaki dosya)
export const downloadSharedPhoto = async (req, res) => {
  const share = await findActiveShare(req.params.token);
  const photo = await prisma.galleryPhoto.findFirst({ where: { id: req.params.id, ...shareScope(share) } });
  if (!photo) throw new AppError("Fotoğraf bulunamadı", 404);
  const target = downloadTarget(photo, parseQuality(req.query.quality));
  const url = await presignDownload(target.key, target.fileName);
  singleLog(photo, target, req, share.id);
  res.json({ url });
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
        ...(await presignVariants(key, file.contentType)),
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
      ...variantRecordFields(file, key),
    };
  });

  const result = await prisma.galleryPhoto.createMany({ data, skipDuplicates: true });

  res.status(201).json({ message: "Fotoğraflar kaydedildi", count: result.count });
};

// Admin: bir kullanıcının galerisi
export const getUserPhotosAdmin = async (req, res) => {
  const [list, missingPreviews] = await Promise.all([
    listPhotosForUser(req.params.userId, req.query),
    prisma.galleryPhoto.count({ where: { userId: req.params.userId, ...missingPreviewWhere } }),
  ]);
  res.json({ ...list, missingPreviews });
};

// Admin: müşterinin indirme geçmişi (son 200) + özet
export const getUserDownloadsAdmin = async (req, res) => {
  const userId = req.params.userId;
  const [rows, total, viaShare, last] = await Promise.all([
    prisma.galleryDownload.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.galleryDownload.count({ where: { userId } }),
    prisma.galleryDownload.count({ where: { userId, shareId: { not: null } } }),
    prisma.galleryDownload.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
  ]);
  res.json({ data: rows, summary: { total, viaShare, lastDownloadAt: last?.createdAt ?? null } });
};

// Admin: fotoğraf sil (önce R2, sonra DB — R2 silinemezse DB kaydı kalır)
export const deletePhoto = async (req, res) => {
  const photo = await prisma.galleryPhoto.findUnique({
    where: { id: req.params.id },
  });

  if (!photo) {
    throw new AppError("Fotoğraf bulunamadı", 404);
  }

  await deleteMediaObjects(photo);
  await prisma.galleryPhoto
    .delete({ where: { id: photo.id } })
    .catch(rethrowPrismaError({ notFound: "Fotoğraf bulunamadı" }));

  res.json({ message: "Fotoğraf silindi" });
};

// Admin: önizlemesi olmayan eski fotoğraflar (tarayıcı önizleme üretsin diye, parça parça)
export const getMissingPreviews = async (req, res) => {
  const where = { userId: req.params.userId, ...missingPreviewWhere };
  const [photos, remaining] = await Promise.all([
    prisma.galleryPhoto.findMany({ where, orderBy: { createdAt: "asc" }, take: MISSING_PREVIEW_BATCH }),
    prisma.galleryPhoto.count({ where }),
  ]);
  res.json({ remaining, files: await missingPreviewItems(photos) });
};

// Admin: tarayıcının yüklediği önizlemeleri kayda bağlar
export const saveMissingPreviews = async (req, res) => {
  const count = await savePreviews(prisma.galleryPhoto, { userId: req.params.userId }, req.body?.files);
  res.json({ message: "Önizlemeler kaydedildi", count });
};

// Admin: kullanıcının bütün fotoğraflarını (ya da ?album= verilirse o albümü) siler
export const deleteAllUserPhotos = async (req, res) => {
  const album = req.query.album ? String(req.query.album).slice(0, 100) : undefined;
  const count = await deleteAllMedia(prisma.galleryPhoto, {
    userId: req.params.userId,
    ...(album && { album }),
  });
  res.json({ message: "Fotoğraflar silindi", count });
};
