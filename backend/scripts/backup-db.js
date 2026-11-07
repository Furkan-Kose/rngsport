/**
 * Veritabanı yedeği: bütün Prisma modelleri JSON olarak dışa aktarılır ve tek .zip yapılır.
 *
 *   node scripts/backup-db.js [hedef-klasör]
 *
 * Varsayılan hedef REPO DIŞINDADIR (~/rngsport-yedekler/<tarih-saat>) — yedek kişisel veri ve
 * çocuk isimleri içerir, git'e asla girmemeli. Her tablo ayrı dosya: <model>.json.
 * Yalnızca okur; veritabanında hiçbir şeyi değiştirmez.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ZipArchive } from "archiver";
import { Prisma } from "@prisma/client";
import prisma from "../src/lib/prisma.js";

const stamp = new Date()
  .toLocaleString("sv-SE", { timeZone: "Europe/Istanbul" })
  .replace(" ", "_")
  .replace(/:/g, "-");
const target = path.resolve(process.argv[2] || path.join(os.homedir(), "rngsport-yedekler", stamp));

const delegateName = (model) => model.charAt(0).toLowerCase() + model.slice(1);
const PAGE = 2000; // büyük tablolar parça parça okunur (uzak DB zaman aşımına düşmesin)

const dumpModel = async (model) => {
  const delegate = prisma[delegateName(model)];
  const rows = [];
  // Her modelde tekil "id" yok (ör. birleşik anahtar); offset ile sayfalanır, sıra sabit olsun diye
  // mümkünse id'ye göre sıralanır.
  const hasId = Prisma.dmmf.datamodel.models
    .find((m) => m.name === model)
    ?.fields.some((f) => f.name === "id");
  for (let skip = 0; ; skip += PAGE) {
    const batch = await delegate.findMany({ skip, take: PAGE, ...(hasId && { orderBy: { id: "asc" } }) });
    rows.push(...batch);
    if (batch.length < PAGE) break;
  }
  return rows;
};

const main = async () => {
  fs.mkdirSync(target, { recursive: true });
  const models = Object.keys(Prisma.ModelName);
  const counts = {};
  for (const model of models) {
    const rows = await dumpModel(model);
    counts[model] = rows.length;
    fs.writeFileSync(path.join(target, `${model}.json`), JSON.stringify(rows, null, 1));
    console.log(`${model.padEnd(20)} ${rows.length}`);
  }
  fs.writeFileSync(
    path.join(target, "_counts.json"),
    JSON.stringify({ takenAt: new Date().toISOString(), counts }, null, 2),
  );

  // Tek parça zip (taşıması kolay); JSON dosyaları da klasörde kalır
  const zipPath = `${target}.zip`;
  await new Promise((resolve, reject) => {
    const out = fs.createWriteStream(zipPath);
    const zip = new ZipArchive({ zlib: { level: 9 } });
    out.on("close", resolve);
    zip.on("error", reject);
    zip.pipe(out);
    zip.directory(target, false);
    zip.finalize();
  });
  console.log(`\nYedek klasörü: ${target}`);
  console.log(`Zip: ${zipPath} (${(fs.statSync(zipPath).size / 1024 / 1024).toFixed(1)} MB)`);
};

main()
  .catch((err) => {
    console.error("Yedek alınamadı:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
