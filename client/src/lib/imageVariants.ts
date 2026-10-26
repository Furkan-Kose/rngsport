import axios from "axios";

// Yüklemede ve eski fotoğrafların önizlemesinde ortak: orijinalden iki JPEG üretilir.
// - thumb: ızgara küçük resmi
// - preview: büyük görünüm + "telefon için" indirme sürümü
// Orijinal dosyaya dokunulmaz; o ayrı yüklenir ve "orijinal kalite" olarak iner.
const THUMB_EDGE = 480;
// Video kapak resmi büyük görünümde de (poster) kullanılır — biraz daha büyük
const VIDEO_POSTER_EDGE = 960;
// Telefon ekranında tam ekran net görünsün (yeni telefonlar ~2500-2800 px), dosya yine küçük
const PREVIEW_EDGE = 2560;
const THUMB_QUALITY = 0.8;
const PREVIEW_QUALITY = 0.88;

// 24 MP'lik bir fotoğraf çözülünce ~100 MB bellek tutar: aynı anda en fazla 2 tane
const MAX_CONCURRENT_DECODES = 2;
let activeDecodes = 0;
const waiting: (() => void)[] = [];

const withDecodeSlot = async <T,>(task: () => Promise<T>): Promise<T> => {
  if (activeDecodes >= MAX_CONCURRENT_DECODES) {
    await new Promise<void>((resolve) => waiting.push(resolve));
  }
  activeDecodes += 1;
  try {
    return await task();
  } finally {
    activeDecodes -= 1;
    waiting.shift()?.();
  }
};

const scaledSize = (width: number, height: number, maxEdge: number) => {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
};

const toJpeg = (source: CanvasImageSource, width: number, height: number, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return reject(new Error("Canvas desteklenmiyor"));
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        // Belleği hemen bırak (büyük canvas'lar mobilde sınırı çabuk doldurur)
        canvas.width = 0;
        canvas.height = 0;
        if (blob) resolve(blob);
        else reject(new Error("Önizleme oluşturulamadı"));
      },
      "image/jpeg",
      quality,
    );
  });

export interface ImageVariants {
  thumb: Blob;
  preview: Blob;
}

// Görselden önizlemeleri üretir. EXIF yönü uygulanır (dikey fotoğraflar yan yatmaz).
export const createImageVariants = (source: Blob): Promise<ImageVariants> =>
  withDecodeSlot(async () => {
    const bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
    try {
      const previewSize = scaledSize(bitmap.width, bitmap.height, PREVIEW_EDGE);
      const thumbSize = scaledSize(bitmap.width, bitmap.height, THUMB_EDGE);
      const preview = await toJpeg(bitmap, previewSize.width, previewSize.height, PREVIEW_QUALITY);
      const thumb = await toJpeg(bitmap, thumbSize.width, thumbSize.height, THUMB_QUALITY);
      return { thumb, preview };
    } finally {
      bitmap.close();
    }
  });

/**
 * Videodan kapak resmi (1. saniye ya da sürenin %10'u). Tarayıcının oynatamadığı codec'te
 * (ör. Windows Chrome'da HEVC .mov) hata verir; çağıran kapak resmisiz devam eder.
 */
export const captureVideoPoster = (source: Blob): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    const cleanup = () => {
      clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
    };
    const fail = (err: Error) => {
      cleanup();
      reject(err);
    };
    const timer = setTimeout(() => fail(new Error("Video karesi alınamadı (zaman aşımı)")), 20000);
    video.onerror = () => fail(new Error("Video açılamadı"));
    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 2;
      video.currentTime = Math.min(1, duration / 10);
    };
    video.onseeked = async () => {
      try {
        if (!video.videoWidth) throw new Error("Video boyutu okunamadı");
        const { width, height } = scaledSize(video.videoWidth, video.videoHeight, VIDEO_POSTER_EDGE);
        const poster = await toJpeg(video, width, height, THUMB_QUALITY);
        cleanup();
        resolve(poster);
      } catch (err) {
        fail(err as Error);
      }
    };
    video.src = url;
  });

// presign yanıtındaki önizleme yükleme bilgileri (görsellerde ikisi, videoda yalnızca thumb)
export interface VariantTargets {
  thumbKey?: string;
  thumbUploadUrl?: string;
  previewKey?: string;
  previewUploadUrl?: string;
}

export interface UploadedVariants {
  thumbKey: string;
  previewKey?: string;
  previewSize?: number;
}

/** Video kapak resmini üretip yükler; olmazsa null (video kapaksız kaydedilir) */
export const uploadVideoPoster = async (source: Blob, targets: VariantTargets): Promise<UploadedVariants | null> => {
  if (!targets.thumbKey || !targets.thumbUploadUrl) return null;
  try {
    const poster = await withDecodeSlot(() => captureVideoPoster(source));
    await axios.put(targets.thumbUploadUrl, poster, { headers: { "Content-Type": "image/jpeg" } });
    return { thumbKey: targets.thumbKey };
  } catch (error) {
    console.warn("Video kapak resmi oluşturulamadı:", error);
    return null;
  }
};

// Önizlemeleri üretip R2'ye yükler. Üretilemezse null: dosya önizlemesiz kaydedilir,
// sitede orijinaliyle görünür (yükleme bu yüzden asla başarısız olmaz).
export const uploadImageVariants = async (
  source: Blob,
  targets: VariantTargets,
): Promise<UploadedVariants | null> => {
  const { thumbKey, thumbUploadUrl, previewKey, previewUploadUrl } = targets;
  if (!thumbKey || !thumbUploadUrl || !previewKey || !previewUploadUrl) return null;
  try {
    const { thumb, preview } = await createImageVariants(source);
    // Plain axios: api singleton'ı withCredentials gönderir, R2'ye cookie gitmemeli
    await Promise.all([
      axios.put(thumbUploadUrl, thumb, { headers: { "Content-Type": "image/jpeg" } }),
      axios.put(previewUploadUrl, preview, { headers: { "Content-Type": "image/jpeg" } }),
    ]);
    return { thumbKey, previewKey, previewSize: preview.size };
  } catch (error) {
    console.warn("Önizleme oluşturulamadı, orijinal kullanılacak:", error);
    return null;
  }
};
