import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AppError } from "../utils/errors.js";
import { env, missingVars } from "../utils/env.js";

const R2_VARS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
];

const BUCKET = env("R2_BUCKET");

// Cloudflare R2: S3 uyumlu API, region her zaman "auto"
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env("R2_ACCESS_KEY_ID"),
    secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
  },
});

// Yapılandırma eksikse AWS SDK anlamsız hatalar veriyor ("No value provided for input
// HTTP label: Bucket", "Resolved credential object is not valid") ve bunlar generic 500'e
// düşüyordu. Hangi değişkenin eksik olduğunu doğrudan söyle — değeri değil, adını.
const assertConfigured = () => {
  const missing = missingVars(R2_VARS);
  if (missing.length) {
    throw new AppError(
      `Görsel deposu yapılandırılmamış (eksik: ${missing.join(", ")}) — sunucu ortam değişkenlerini kontrol edin`,
      503,
    );
  }
};

// R2'den gelen hatayı teşhis edilebilir hale getirir. Sadece hata adı + HTTP kodu
// dışarı verilir; yanıt gövdesi ve kimlik bilgileri asla sızmaz.
const asR2Error = (error) => {
  if (error?.isAppError) return error;
  const name = error?.name || "UnknownError";
  const status = error?.$metadata?.httpStatusCode;
  return new AppError(
    `R2 erişilemedi: ${name}${status ? ` (${status})` : ""}`,
    502,
  );
};

// Yapılandırmayı doğrular, R2 hatalarını sarmalar. Orijinal hata log'a düşer.
const withR2 = async (operation) => {
  assertConfigured();
  try {
    return await operation();
  } catch (error) {
    if (error?.isAppError) throw error;
    console.error("[r2]", error);
    throw asR2Error(error);
  }
};

// Tarayıcıdan direkt R2'ye yükleme için imzalı PUT URL'i (15 dk)
export const presignUpload = (key, contentType) =>
  withR2(() =>
    getSignedUrl(
      r2,
      new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
      { expiresIn: 15 * 60 }
    )
  );

// Galeri görüntüleme için imzalı GET URL'i (1 saat)
export const presignView = (key) =>
  withR2(() =>
    getSignedUrl(r2, new GetObjectCommand({ Bucket: BUCKET, Key: key }), {
      expiresIn: 60 * 60,
    })
  );

// İndirme için imzalı GET URL'i (5 dk) — RFC 5987 ile Türkçe dosya adı desteği
export const presignDownload = (key, fileName) =>
  withR2(() =>
    getSignedUrl(
      r2,
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      }),
      { expiresIn: 5 * 60 }
    )
  );

export const deleteObject = (key) =>
  withR2(() => r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key })));

// Toplu zip indirme için objeyi Node stream olarak döner
export const getObjectStream = async (key) => {
  const response = await withR2(() =>
    r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
  );
  return response.Body;
};

// Proxy servisi için tam yanıt (Body + ContentType + ContentLength).
// NoSuchKey burada sarmalanmaz: çağıran (servePackageImage) onu 404'e çeviriyor.
export const getObject = async (key) => {
  assertConfigured();
  try {
    return await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (error) {
    if (error?.name === "NoSuchKey" || error?.$metadata?.httpStatusCode === 404) {
      throw error;
    }
    console.error("[r2]", error);
    throw asR2Error(error);
  }
};
