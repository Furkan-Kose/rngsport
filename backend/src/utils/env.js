// Ortam değişkeni okuma ve açılışta yapılandırma doğrulaması.
//
// Neden var: eksik/hatalı bir env değişkeni bugüne kadar sessizce kalıyor, sorun ancak
// çalışma anında anlamsız bir 500 olarak görünüyordu. Artık deploy'un ilk saniyesinde
// loglarda hangi değişkenin eksik olduğu yazıyor.

// Değeri kırparak okur. Panel (Railway/Netlify) yapıştırmalarında sondaki boşluk ve
// newline çok sık ve sessizce bozuyor: "bucket\n" imzalı URL'de "bucket%0A" oluyor.
export const env = (name) => process.env[name]?.trim() || undefined;

// Yoksa uygulama zaten çalışamaz
const REQUIRED = ["DATABASE_URL", "JWT_SECRET"];

// Sadece production'da zorunlu (lokalde makul varsayılanlar var)
const REQUIRED_IN_PRODUCTION = ["BACKEND_URL", "FRONTEND_URL"];

// Eksikse uygulama ayağa kalkar ama o özellik çalışmaz
const FEATURES = {
  "Cloudflare R2 (galeri + paket görselleri)": [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET",
  ],
  "iyzico (online ödeme)": [
    "IYZICO_API_KEY",
    "IYZICO_SECRET_KEY",
    "IYZICO_BASE_URL",
  ],
  "Resend (e-posta)": ["RESEND_API_KEY", "MAIL_FROM"],
};

export const missingVars = (names) => names.filter((name) => !env(name));

export const isProduction = () => env("NODE_ENV") === "production";

// Açılışta çağrılır. Değer ASLA loglanmaz — yalnızca değişken adı.
export const checkEnv = () => {
  const fatal = [];

  const missingRequired = missingVars(REQUIRED);
  if (missingRequired.length) {
    fatal.push(`zorunlu: ${missingRequired.join(", ")}`);
  }

  if (isProduction()) {
    const missingProd = missingVars(REQUIRED_IN_PRODUCTION);
    if (missingProd.length) {
      fatal.push(`production'da zorunlu: ${missingProd.join(", ")}`);
    }
  } else {
    console.warn(
      "[config] NODE_ENV=production değil — çerezler sameSite=lax ile gidiyor (canlıda cross-site giriş çalışmaz)",
    );
  }

  for (const [feature, names] of Object.entries(FEATURES)) {
    const missing = missingVars(names);
    console[missing.length ? "warn" : "log"](
      missing.length
        ? `[config] ✗ ${feature} — eksik: ${missing.join(", ")}`
        : `[config] ✓ ${feature}`,
    );
  }

  if (fatal.length) {
    console.error(`[config] Eksik ortam değişkeni → ${fatal.join(" | ")}`);
    process.exit(1);
  }
};
