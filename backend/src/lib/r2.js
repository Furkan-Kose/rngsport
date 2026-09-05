import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET = process.env.R2_BUCKET;

// Cloudflare R2: S3 uyumlu API, region her zaman "auto"
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Tarayıcıdan direkt R2'ye yükleme için imzalı PUT URL'i (15 dk)
export const presignUpload = (key, contentType) =>
  getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 15 * 60 }
  );

// Galeri görüntüleme için imzalı GET URL'i (1 saat)
export const presignView = (key) =>
  getSignedUrl(r2, new GetObjectCommand({ Bucket: BUCKET, Key: key }), {
    expiresIn: 60 * 60,
  });

// İndirme için imzalı GET URL'i (5 dk) — RFC 5987 ile Türkçe dosya adı desteği
export const presignDownload = (key, fileName) =>
  getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    }),
    { expiresIn: 5 * 60 }
  );

export const deleteObject = (key) =>
  r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));

// Toplu zip indirme için objeyi Node stream olarak döner
export const getObjectStream = async (key) => {
  const response = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  return response.Body;
};

// Proxy servisi için tam yanıt (Body + ContentType + ContentLength)
export const getObject = (key) =>
  r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
