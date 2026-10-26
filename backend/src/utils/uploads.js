import { ZipArchive } from "archiver";
import { AppError } from "./errors.js";
import { slugify } from "./slugify.js";
import { deleteObject, deleteObjects, getObjectStream, presignUpload, presignView } from "../lib/r2.js";

// Müşteri galerisi ve ödül töreni galerileri aynı yükleme kurallarını paylaşır.
export const MAX_FILES_PER_BATCH = 100;
const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_VIDEO_SIZE = 1024 * 1024 * 1024; // 1GB (R2 tek PUT sınırı 5GB)
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "webm"]);

const getExtension = (fileName) => {
  const ext = String(fileName).split(".").pop()?.toLowerCase();
  return IMAGE_EXTENSIONS.has(ext) || VIDEO_EXTENSIONS.has(ext) ? ext : null;
};

// presign isteğindeki dosya listesini doğrular
export const assertUploadBatch = (files) => {
  if (!Array.isArray(files) || files.length === 0) {
    throw new AppError("Dosya listesi gerekli", 400);
  }
  if (files.length > MAX_FILES_PER_BATCH) {
    throw new AppError(`Tek seferde en fazla ${MAX_FILES_PER_BATCH} dosya yüklenebilir`, 400);
  }
};

// Tek dosyayı doğrular, R2 key'i için uzantıyı döner
export const validateUploadFile = (file) => {
  const { fileName, contentType, size } = file || {};
  if (!fileName || !contentType) {
    throw new AppError("Her dosya için ad ve tür gerekli", 400);
  }
  const isImage = String(contentType).startsWith("image/");
  const isVideo = String(contentType).startsWith("video/");
  if (!isImage && !isVideo) {
    throw new AppError(`Sadece görsel veya video yüklenebilir: ${fileName}`, 400);
  }
  if (size && isImage && size > MAX_IMAGE_SIZE) {
    throw new AppError(`Fotoğraf 50MB'ı aşamaz: ${fileName}`, 400);
  }
  if (size && isVideo && size > MAX_VIDEO_SIZE) {
    throw new AppError(`Video 1GB'ı aşamaz: ${fileName}`, 400);
  }
  const ext = getExtension(fileName);
  if (!ext) {
    throw new AppError(`Desteklenmeyen dosya türü (jpg/png/webp/mp4/mov/webm): ${fileName}`, 400);
  }
  return ext;
};

// confirm isteğindeki tek dosyanın DB alanları (key doğrulaması çağırana ait)
export const fileRecordFields = ({ fileName, size, contentType }) => {
  if (!fileName) {
    throw new AppError("Dosya adı gerekli", 400);
  }
  return {
    fileName: String(fileName).slice(0, 255),
    size: Number.isFinite(size) ? Math.round(size) : null,
    contentType: contentType ? String(contentType).slice(0, 100) : null,
  };
};

// --- Önizlemeler -------------------------------------------------------------
// Tarayıcı yüklerken her fotoğraftan iki JPEG üretir: ızgara için küçük resim (thumb) ve
// büyük görünüm + "telefon için" indirme sürümü (preview). Orijinal hiç değişmez.
// Key'ler orijinalin key'inden türetilir; confirm başka bir key kabul etmez (başka
// klasöre yazılamasın diye). Önizlemesi olmayan eski kayıtlar orijinalle gösterilir.
//
// Klasör düzeni (2026-10-25'ten itibaren yeni yüklemeler): orijinal `…/orijinal/{uuid}.jpg`,
// önizlemeler `…/onizleme/{uuid}-thumb.jpg` ve `-preview.jpg`. Eski düzende (orijinal klasörsüz)
// yüklenmiş dosyanın önizlemesi de artık `…/onizleme/` altına üretilir. Var olan kayıtlar
// etkilenmez: thumbKey/previewKey DB'de ayrı ayrı saklanıyor.
export const ORIGINAL_DIR = "orijinal";
export const PREVIEW_DIR = "onizleme";

export const variantKeys = (r2Key) => {
  const key = String(r2Key);
  const slash = key.lastIndexOf("/");
  const dir = key.slice(0, slash + 1);
  const name = key.slice(slash + 1).replace(/\.[^.]+$/, "");
  const parent = dir.endsWith(`/${ORIGINAL_DIR}/`) ? dir.slice(0, -(ORIGINAL_DIR.length + 1)) : dir;
  const base = `${parent}${PREVIEW_DIR}/${name}`;
  return { thumbKey: `${base}-thumb.jpg`, previewKey: `${base}-preview.jpg` };
};

const isImageType = (contentType) => String(contentType || "").startsWith("image/");
const isVideoType = (contentType) => String(contentType || "").startsWith("video/");

// presign yanıtına eklenir: görsellerde iki önizleme, videolarda yalnızca kapak resmi (thumb —
// tarayıcı videodan bir kare alır). Videonun "küçük boyut" sürümü yok; indirme hep orijinal.
export const presignVariants = async (key, contentType) => {
  if (isVideoType(contentType)) {
    const { thumbKey } = variantKeys(key);
    return { thumbKey, thumbUploadUrl: await presignUpload(thumbKey, "image/jpeg") };
  }
  if (!isImageType(contentType)) return {};
  const { thumbKey, previewKey } = variantKeys(key);
  const [thumbUploadUrl, previewUploadUrl] = await Promise.all([
    presignUpload(thumbKey, "image/jpeg"),
    presignUpload(previewKey, "image/jpeg"),
  ]);
  return { thumbKey, thumbUploadUrl, previewKey, previewUploadUrl };
};

// confirm'deki önizleme alanları: yalnızca orijinalden türetilen key'ler kabul edilir.
// Tarayıcı önizleme üretemediyse (desteklenmeyen format) alanlar boş kalır.
export const variantRecordFields = (file, r2Key) => {
  if (!file?.thumbKey && !file?.previewKey) return {};
  const expected = variantKeys(r2Key);
  if ((file.thumbKey && file.thumbKey !== expected.thumbKey) || (file.previewKey && file.previewKey !== expected.previewKey)) {
    throw new AppError("Geçersiz önizleme anahtarı", 400);
  }
  // Video: yalnızca kapak resmi. Görsel: ikisi birlikte (biri eksikse hiç kaydedilmez).
  if (isVideoType(file.contentType)) {
    return file.thumbKey ? { thumbKey: expected.thumbKey } : {};
  }
  if (!file.thumbKey || !file.previewKey) return {};
  return {
    thumbKey: expected.thumbKey,
    previewKey: expected.previewKey,
    previewSize: Number.isFinite(file.previewSize) ? Math.round(file.previewSize) : null,
  };
};

// Liste yanıtındaki görüntüleme linkleri (thumb/preview yoksa null → istemci orijinale düşer)
export const mediaViewFields = async (photo) => {
  const [url, thumbUrl, previewUrl] = await Promise.all([
    presignView(photo.r2Key),
    photo.thumbKey ? presignView(photo.thumbKey) : null,
    photo.previewKey ? presignView(photo.previewKey) : null,
  ]);
  return { url, thumbUrl, previewUrl, previewSize: photo.previewSize ?? null };
};

// "Seçilenleri indir": POST gövdesindeki id listesi (en fazla 2000). Yoksa null → tümü.
export const MAX_SELECTED_IDS = 2000;
export const parseSelectedIds = (body) => {
  if (!Array.isArray(body?.ids)) return null;
  const ids = [...new Set(body.ids.filter((id) => typeof id === "string" && id.length <= 50))];
  if (ids.length === 0) throw new AppError("Seçili dosya yok", 400);
  if (ids.length > MAX_SELECTED_IDS) throw new AppError(`En fazla ${MAX_SELECTED_IDS} dosya seçilebilir`, 400);
  return ids;
};

// ?quality=preview → "telefon için" sürüm; diğer her değer orijinal
export const parseQuality = (value) => (value === "preview" ? "preview" : "original");

// İndirilecek dosya: önizleme istenip varsa önizleme, yoksa orijinal
export const downloadTarget = (photo, quality) =>
  quality === "preview" && photo.previewKey
    ? {
        key: photo.previewKey,
        fileName: `${String(photo.fileName).replace(/\.[^.]+$/, "")}-small.jpg`,
        size: photo.previewSize ?? null,
      }
    : { key: photo.r2Key, fileName: photo.fileName, size: photo.size ?? null };

// Toplu indirme butonlarındaki boyutlar: orijinal toplam + "telefon için" toplam
// (önizlemesi olmayan dosya — video veya eski kayıt — orijinaliyle sayılır)
export const downloadSizes = async (model, where) => {
  const [all, withPreview] = await Promise.all([
    model.aggregate({ where, _sum: { size: true } }),
    model.aggregate({
      where: { ...where, previewKey: { not: null } },
      _sum: { size: true, previewSize: true },
      _count: true,
    }),
  ]);
  const original = all._sum.size ?? 0;
  return {
    original,
    preview: original - (withPreview._sum.size ?? 0) + (withPreview._sum.previewSize ?? 0),
    hasPreview: withPreview._count > 0,
  };
};

// Orijinal + önizlemeler R2'den silinir (önizleme silinemezse yalnızca log)
export const deleteMediaObjects = async (photo) => {
  await deleteObject(photo.r2Key);
  for (const key of [photo.thumbKey, photo.previewKey].filter(Boolean)) {
    await deleteObject(key).catch((err) =>
      console.error(`[r2] Önizleme silinemedi (${key}):`, err.message)
    );
  }
};

// Eski kayıtlar için önizleme üretimi (admin, tarayıcıda): önizlemesi olmayan görseller,
// orijinalin okuma linki ve önizlemelerin yükleme linkleriyle. Parça parça çağrılır.
export const MISSING_PREVIEW_BATCH = 20;
export const missingPreviewWhere = { previewKey: null, contentType: { startsWith: "image/" } };

export const missingPreviewItems = async (photos) =>
  Promise.all(
    photos.map(async (photo) => ({
      id: photo.id,
      fileName: photo.fileName,
      url: await presignView(photo.r2Key),
      ...(await presignVariants(photo.r2Key, photo.contentType)),
    }))
  );

// Tarayıcı önizlemeleri yükledikten sonra kayıtları günceller. Key'ler yine sunucuda türetilir.
export const savePreviews = async (model, scopeWhere, items) => {
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_FILES_PER_BATCH) {
    throw new AppError("Önizleme listesi gerekli", 400);
  }
  const ids = items.map((item) => String(item?.id));
  const photos = await model.findMany({ where: { ...scopeWhere, id: { in: ids } } });
  const sizeById = new Map(items.map((item) => [String(item.id), item.previewSize]));
  await Promise.all(
    photos.map((photo) => {
      const size = sizeById.get(photo.id);
      return model.update({
        where: { id: photo.id },
        data: {
          ...variantKeys(photo.r2Key),
          previewSize: Number.isFinite(size) ? Math.round(size) : null,
        },
      });
    })
  );
  return photos.length;
};

// Zip içindeki dosya yolları. Aynı klasörde aynı ad iki kez geçerse id ile ayrışır.
// Sunucu zip'i ve tarayıcıda oluşturulan zip aynı adları üretsin diye ortak.
const zipEntryNames = (photos, folderOf) => {
  const usedNames = new Set();
  return photos.map((photo) => {
    const folder = folderOf(photo);
    let name = photo.fileName;
    if (usedNames.has(`${folder}/${name}`)) {
      name = `${photo.id.slice(-6)}-${name}`;
    }
    usedNames.add(`${folder}/${name}`);
    return folder ? `${folder}/${name}` : name;
  });
};

// Tarayıcıda zip için dosya listesi: zip içi ad + boyut + doğrudan R2 linki.
// Dosyalar Railway'den geçmez (R2 çıkış trafiği ücretsiz). Linkler 1 saat geçerli.
// quality=preview: önizlemesi olan görseller "telefon için" sürümüyle girer (adı -small.jpg).
const zipTargets = (photos, quality) =>
  photos.map((photo) => ({ ...photo, ...downloadTarget(photo, quality) }));

const zipNameFor = (zipName, quality) =>
  quality === "preview" ? zipName.replace(/\.zip$/, "-small.zip") : zipName;

export const zipManifest = async (photos, zipName, folderOf = () => null, quality = "original") => {
  const targets = zipTargets(photos, quality);
  const names = zipEntryNames(targets, folderOf);
  const files = await Promise.all(
    targets.map(async (target, i) => ({
      name: names[i],
      size: target.size,
      url: await presignView(target.key),
    }))
  );
  return {
    zipName: zipNameFor(zipName, quality),
    totalSize: targets.reduce((sum, t) => sum + (t.size || 0), 0),
    files,
  };
};

// Dosyaları R2'den okuyup zip olarak response'a stream'ler (yedek yol: tarayıcının
// zip'i oluşturamadığı çok büyük galeriler — örn. telefonda).
// folderOf(photo): zip içindeki klasör adı (yoksa kök).
export const streamZip = async (res, photos, zipName, folderOf = () => null, quality = "original") => {
  res.setHeader("Content-Type", "application/zip");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename*=UTF-8''${encodeURIComponent(zipNameFor(zipName, quality))}`
  );

  // Foto/videolar zaten sıkıştırılmış — level 0 (store) ile CPU harcamadan paketle
  const archive = new ZipArchive({ zlib: { level: 0 } });
  archive.on("error", (err) => {
    console.error("Zip stream hatası:", err);
    res.destroy(err);
  });
  archive.pipe(res);

  // Dosyalar TEK TEK açılır ve ziyaretçi indirmeyi yarıda keserse açık R2 akışı kapatılır.
  // Önceden hepsi baştan açılıyordu; telefonda yarıda bırakılan indirmeler S3 istemcisinin
  // bağlantı havuzunu doldurup bütün R2 okumalarını (paket görselleri dahil) kilitledi.
  let aborted = false;
  let current = null;
  res.on("close", () => {
    if (res.writableFinished) return;
    aborted = true;
    current?.destroy();
    archive.abort();
  });

  const targets = zipTargets(photos, quality);
  const names = zipEntryNames(targets, folderOf);
  for (const [i, target] of targets.entries()) {
    if (aborted) return;
    const body = await getObjectStream(target.key);
    if (aborted) {
      body.destroy();
      return;
    }
    current = body;
    archive.append(body, { name: names[i] });
    // Arşiv bu dosyayı bitirene (ya da akış kapanana) kadar bir sonrakini açma
    await new Promise((resolve) => {
      body.once("end", resolve);
      body.once("close", resolve);
      body.once("error", resolve);
    });
  }

  if (!aborted) await archive.finalize();
};

export const zipFileName = (label, fallback) => `rngsport-${slugify(label) || fallback}.zip`;

// Kayıtların R2 dosyalarını (orijinal + önizlemeler) toplu siler — yanıt dönmeden biter,
// böylece sunucu yeniden başlasa da yarım kalmaz. Hata yalnızca loglanır: DB kaydı zaten
// silinmiştir, kayıtsız dosya sitede görünmez (DB tek doğruluk kaynağı).
export const deleteMediaFiles = async (photos, label = "Dosya") => {
  const keys = photos.flatMap((p) => [p.r2Key, p.thumbKey, p.previewKey]).filter(Boolean);
  if (keys.length === 0) return;
  try {
    const failed = await deleteObjects(keys);
    if (failed.length) console.error(`[r2] ${label}: ${failed.length} dosya silinemedi, örn. ${failed[0]}`);
  } catch (err) {
    console.error(`[r2] ${label} toplu silme hatası (${keys.length} dosya):`, err.message);
  }
};

// Toplu silme (admin "Tüm fotoğrafları sil"): önce DB kayıtları, sonra R2 (toplu, beklenir)
export const deleteAllMedia = async (model, where) => {
  const photos = await model.findMany({
    where,
    select: { id: true, r2Key: true, thumbKey: true, previewKey: true },
  });
  if (photos.length === 0) return 0;
  await model.deleteMany({ where: { id: { in: photos.map((p) => p.id) } } });
  await deleteMediaFiles(photos);
  return photos.length;
};
