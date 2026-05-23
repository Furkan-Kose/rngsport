// Test amaçlı çekim listesi Excel'leri üretir (3 gün)
import * as XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, ".."); // D:\rngsport

const APPARATUS = ["Top", "Labut", "İp", "Kurdele", "Çember", "Serbest"];

const FIRST = [
  "Zeynep", "Elif", "Defne", "Azra", "Ada", "Nehir", "Duru", "Mavi",
  "Ela", "Lina", "Asya", "Eylül", "Beren", "Naz", "Ece", "İpek",
];
const SECOND = [
  "Ada", "Naz", "Su", "Deniz", "Irmak", "Bal", "Mira", "Ela",
];
const LAST = [
  "Yıldız", "Kaya", "Demir", "Şahin", "Aydın", "Çelik", "Arslan",
  "Doğan", "Korkmaz", "Yılmaz", "Aksoy", "Polat",
];
const CLUBS = [
  "Ankara Ritmik GSK", "İzmir Cimnastik SK", "İstanbul Jimnastik Kulübü",
  "Bursa Gençlik SK", "Antalya Ritmik SK", "Eskişehir Cimnastik Kulübü",
];

const pick = (arr, i) => arr[i % arr.length];
const pad = (n) => String(n).padStart(2, "0");

// dakikadan "SS:DD" üret (09:00 başlangıç)
const timeFrom = (startMin, idx) => {
  const total = 9 * 60 + startMin + idx * 5;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
};

const buildDay = (seed, count) => {
  const rows = [];
  let sira = 1;
  let timeIdx = 0;

  for (let i = 0; i < count; i++) {
    const name = `${pick(FIRST, seed + i)} ${pick(SECOND, seed + i * 2)} ${pick(LAST, seed + i)}`;
    const club = pick(CLUBS, seed + i);
    const birthYear = 2009 + ((seed + i) % 6); // 2009-2014

    // Bazı sporcular (her 4'te 1) iki aletten yarışsın
    const apparatusCount = i % 4 === 0 ? 2 : 1;
    for (let a = 0; a < apparatusCount; a++) {
      rows.push({
        "Sıra": sira++,
        "Ad Soyad": name,
        "Kulüp": club,
        "Doğum Yılı": birthYear,
        "Alet": pick(APPARATUS, seed + i + a * 3),
        "Saat": timeFrom(0, timeIdx++),
      });
    }
  }
  return rows;
};

const days = [
  { file: "cekim-listesi-gun1.xlsx", rows: buildDay(0, 12) },
  { file: "cekim-listesi-gun2.xlsx", rows: buildDay(5, 14) },
  { file: "cekim-listesi-gun3.xlsx", rows: buildDay(9, 10) },
];

for (const day of days) {
  const ws = XLSX.utils.json_to_sheet(day.rows, {
    header: ["Sıra", "Ad Soyad", "Kulüp", "Doğum Yılı", "Alet", "Saat"],
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Cekim Listesi");
  const out = path.join(OUT_DIR, day.file);
  XLSX.writeFile(wb, out);
  console.log(`✔ ${day.file} — ${day.rows.length} satır → ${out}`);
}
