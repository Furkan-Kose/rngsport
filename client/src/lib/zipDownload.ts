import { downloadZip } from "client-zip";
import api, { API_URL } from "./api";

// "Tümünü indir": zip TARAYICIDA oluşturulur, dosyalar doğrudan R2'den iner.
// Sunucuda zip (download-all) Railway'in ücretli çıkış trafiğinden geçiyordu; R2 çıkışı
// ücretsiz. Çok büyük galeri + diske doğrudan yazamayan tarayıcı (telefon) için
// sunucu zip'i yedek yol olarak kalıyor.

interface ZipManifest {
  zipName: string;
  totalSize: number;
  files: { name: string; size: number | null; url: string }[];
}

// File System Access API (Chrome/Edge masaüstü): zip belleğe alınmadan diske akar
type SaveFilePicker = (options: {
  suggestedName: string;
  types: { description: string; accept: Record<string, string[]> }[];
}) => Promise<{ createWritable: () => Promise<WritableStream> }>;

const MB = 1024 * 1024;
export const isMobileDevice = () => /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent);
// Diske akıtılamıyorsa zip bellekte (Blob) oluşur. Sınırlar bilinçli olarak düşük:
// - telefonda tarayıcı zip'i ancak sekme açık + ekran açıkken hazırlanabiliyor (kilitlenince
//   durur) ve bellek kısıtlı; sunucu zip'ini ise indirme yöneticisi arka planda indiriyor
// - masaüstü Safari/Firefox'ta da büyük Blob düşük RAM'li cihazı zorlar
// Üstü sunucu zip'ine düşer (Railway trafiği, ama güvenilir). Chrome/Edge masaüstü
// diske akıttığı için sınırsız ve ücretsiz.
const memoryLimit = () => (isMobileDevice() ? 150 * MB : 500 * MB);

export type ZipResult = "done" | "server" | "cancelled";

interface DownloadAllOptions {
  manifestPath: string; // ör. /api/gallery/my/download-manifest?album=...
  fallbackPath: string; // sunucu zip'i: /api/gallery/my/download-all?album=...
  onProgress: (done: number, total: number) => void;
}

export const downloadAllAsZip = async ({
  manifestPath,
  fallbackPath,
  onProgress,
}: DownloadAllOptions): Promise<ZipResult> => {
  const picker = (window as unknown as { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker;

  // Kaydetme penceresi kullanıcının tıklamasına bağlı olmalı: ağ isteğinden ÖNCE aç
  let writable: WritableStream | null = null;
  if (picker) {
    try {
      const handle = await picker({
        suggestedName: "rngsport-galeri.zip",
        types: [{ description: "ZIP arşivi", accept: { "application/zip": [".zip"] } }],
      });
      writable = await handle.createWritable();
    } catch (error) {
      if ((error as Error).name === "AbortError") return "cancelled";
      writable = null; // pencere açılamadı → bellek yolu
    }
  }

  const { data } = await api.get<ZipManifest>(manifestPath);

  if (!writable && data.totalSize > memoryLimit()) {
    // Çok büyük + diske akıtılamıyor: sunucu zip'i (cookie üst seviye navigasyonla gider)
    window.location.href = `${API_URL}${fallbackPath}`;
    return "server";
  }

  // Linkler 1 saat geçerli; uzun indirmede süresi dolarsa listeyi yenileyip devam et
  let urls = new Map(data.files.map((f) => [f.name, f.url]));
  const fetchFile = async (name: string) => {
    let response = await fetch(urls.get(name)!);
    if (!response.ok) {
      const { data: fresh } = await api.get<ZipManifest>(manifestPath);
      urls = new Map(fresh.files.map((f) => [f.name, f.url]));
      response = await fetch(urls.get(name)!);
    }
    if (!response.ok) throw new Error(`Dosya indirilemedi: ${name}`);
    return response;
  };

  const total = data.files.length;
  onProgress(0, total);
  async function* entries() {
    for (const [index, file] of data.files.entries()) {
      yield { name: file.name, input: await fetchFile(file.name) };
      onProgress(index + 1, total);
    }
  }

  const zip = downloadZip(entries());

  if (writable) {
    await zip.body!.pipeTo(writable);
    return "done";
  }

  const blob = await zip.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = data.zipName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // İndirme başlasın diye biraz bekleyip belleği bırak
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return "done";
};
