import { ZipArchive } from "archiver";
import { AppError } from "./errors.js";
import { slugify } from "./slugify.js";
import { getObjectStream } from "../lib/r2.js";

// Müşteri galerisi ve ödül töreni galerileri aynı yükleme kurallarını paylaşır.
export const MAX_FILES_PER_BATCH = 100;
const MAX_IMAGE_SIZE = 30 * 1024 * 1024; // 30MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
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
    throw new AppError(`Fotoğraf 30MB'ı aşamaz: ${fileName}`, 400);
  }
  if (size && isVideo && size > MAX_VIDEO_SIZE) {
    throw new AppError(`Video 500MB'ı aşamaz: ${fileName}`, 400);
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

// Dosyaları R2'den okuyup zip olarak response'a stream'ler.
// folderOf(photo): zip içindeki klasör adı (yoksa kök).
export const streamZip = async (res, photos, zipName, folderOf = () => null) => {
  res.setHeader("Content-Type", "application/zip");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename*=UTF-8''${encodeURIComponent(zipName)}`
  );

  // Foto/videolar zaten sıkıştırılmış — level 0 (store) ile CPU harcamadan paketle
  const archive = new ZipArchive({ zlib: { level: 0 } });
  archive.on("error", (err) => {
    console.error("Zip stream hatası:", err);
    res.destroy(err);
  });
  archive.pipe(res);

  // Aynı dosya adları çakışmasın diye takip et
  const usedNames = new Set();
  for (const photo of photos) {
    const folder = folderOf(photo);
    let name = photo.fileName;
    if (usedNames.has(`${folder}/${name}`)) {
      name = `${photo.id.slice(-6)}-${name}`;
    }
    usedNames.add(`${folder}/${name}`);

    const body = await getObjectStream(photo.r2Key);
    archive.append(body, { name: folder ? `${folder}/${name}` : name });
  }

  await archive.finalize();
};

export const zipFileName = (label, fallback) => `rngsport-${slugify(label) || fallback}.zip`;
