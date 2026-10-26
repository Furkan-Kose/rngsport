import { pipeline } from "node:stream";
import { AppError } from "./errors.js";
import { getObject } from "../lib/r2.js";

// R2'deki herkese açık bir görseli sabit URL ile servis eder (tarayıcı cache'ler).
// pipe() değil pipeline(): ziyaretçi bağlantıyı keserse R2 akışı da kapanır — kapanmayan
// akışlar S3 istemcisinin bağlantı havuzunu doldurup bütün R2 okumalarını kilitlemişti.
// fileRegex yalnızca uuid'li dosya adlarına izin verir (users/ gibi klasörlere erişim yok).
export const serveR2Image = async (res, prefix, file, fileRegex) => {
  if (!fileRegex.test(file)) {
    throw new AppError("Görsel bulunamadı", 404);
  }
  let object;
  try {
    object = await getObject(`${prefix}${file}`);
  } catch (err) {
    if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) {
      throw new AppError("Görsel bulunamadı", 404);
    }
    throw err;
  }
  res.setHeader("Content-Type", object.ContentType || "image/webp");
  if (object.ContentLength) res.setHeader("Content-Length", object.ContentLength);
  // Key'ler uuid olduğu için içerik hiç değişmez — güvenle immutable
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  pipeline(object.Body, res, (err) => {
    if (err && err.code !== "ERR_STREAM_PREMATURE_CLOSE") {
      console.error("[r2] Görsel aktarılamadı:", err.message);
    }
  });
};
