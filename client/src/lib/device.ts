// Cihaz / tarayıcı yetenekleri — indirme ve "galeriye kaydet" akışları bunlara göre davranır.

export const isMobileDevice = () => /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent);

// iPadOS 13+ kendini masaüstü Mac gibi tanıtır; dokunmatik Mac yok, bununla ayırt edilir
export const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export const isAndroid = () => /Android/i.test(navigator.userAgent);

/**
 * Paylaşım menüsüyle dosya gönderilebiliyor mu (iPhone: "Resimleri Kaydet" → Fotoğraflar,
 * Android: Galeri/Fotoğraflar). Masaüstünde false döner; orada indirme kullanılır.
 */
export const canShareFiles = () => {
  if (!isMobileDevice() || typeof navigator.canShare !== "function") return false;
  try {
    return navigator.canShare({ files: [new File(["x"], "x.jpg", { type: "image/jpeg" })] });
  } catch {
    return false;
  }
};

/**
 * Sayfa içinde süren uzun işlerde (tarayıcıda zip, galeriye kaydetme) ekran kendiliğinden
 * kararmasın: kilitlenirse tarayıcı sekmeyi durdurur ve iş yarıda kalır. Desteklenmeyen
 * tarayıcıda sessizce hiçbir şey yapmaz. Dönen fonksiyon kilidi bırakır.
 */
export const keepScreenOn = async (): Promise<() => void> => {
  const nav = navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> } };
  if (!nav.wakeLock) return () => {};
  try {
    const lock = await nav.wakeLock.request("screen");
    return () => {
      lock.release().catch(() => {});
    };
  } catch {
    return () => {};
  }
};
