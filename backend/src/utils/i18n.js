// Çok dillilik (tr / en / ru) — sunucu tarafı.
//
// - İsteğin dili Accept-Language başlığından okunur (istemci her isteğe ekler).
// - Mesajlar kodda Türkçe yazılmaya devam eder; `translateResponses` ara katmanı
//   res.json'daki `message`'ı istek diline çevirir. Sözlükte olmayan mesaj
//   Türkçe gider, hiçbir şey bozulmaz. Admin paneli Türkçe istek attığı için
//   etkilenmez.
// - Panelden girilen içerik (paket, turnuva, tören, seviye) `translations` JSON
//   alanında tutulur: { en: { name: "..." }, ru: { ... } }. Boş alan Türkçeye düşer.

import prisma from "../lib/prisma.js";

export const LOCALES = ["tr", "en", "ru"];
export const DEFAULT_LOCALE = "tr";
const TRANSLATED_LOCALES = LOCALES.filter((l) => l !== DEFAULT_LOCALE);

export const normalizeLocale = (value) =>
  LOCALES.includes(value) ? value : DEFAULT_LOCALE;

// "en-GB,en;q=0.9" → "en". İlk desteklenen dil kazanır.
export const getLocale = (req) => {
  const header = req.headers?.["accept-language"];
  if (!header) return DEFAULT_LOCALE;
  for (const part of header.split(",")) {
    const code = part.trim().slice(0, 2).toLowerCase();
    if (LOCALES.includes(code)) return code;
  }
  return DEFAULT_LOCALE;
};

// ---------------------------------------------------------------------------
// İçerik çevirileri
// ---------------------------------------------------------------------------

const hasValue = (v) =>
  Array.isArray(v) ? v.some((x) => typeof x === "string" && x.trim()) : typeof v === "string" && v.trim() !== "";

// record'un `fields` alanlarını istek diline çevirir (boş çeviri → Türkçe)
export const localize = (record, locale, fields) => {
  if (!record || locale === DEFAULT_LOCALE) return record;
  const tr = record.translations?.[locale];
  if (!tr) return record;
  const out = { ...record };
  for (const field of fields) {
    if (hasValue(tr[field])) out[field] = tr[field];
  }
  return out;
};

// Admin formundan gelen translations'ı temizler: sadece izinli diller ve alanlar,
// metinler kırpılır, boşlar atılır. `arrayFields` satır listesi (ör. features).
// undefined → alan hiç gönderilmedi (değişmez); null/{} → çeviriler temizlenir.
export const sanitizeTranslations = (input, { stringFields = [], arrayFields = [] } = {}) => {
  if (input === undefined) return undefined;
  if (!input || typeof input !== "object") return {};
  const out = {};
  for (const locale of TRANSLATED_LOCALES) {
    const src = input[locale];
    if (!src || typeof src !== "object") continue;
    const entry = {};
    for (const f of stringFields) {
      if (typeof src[f] === "string" && src[f].trim()) entry[f] = src[f].trim().slice(0, 2000);
    }
    for (const f of arrayFields) {
      if (Array.isArray(src[f])) {
        const list = src[f]
          .filter((x) => typeof x === "string")
          .map((x) => x.trim().slice(0, 500))
          .filter(Boolean)
          .slice(0, 50);
        if (list.length) entry[f] = list;
      }
    }
    if (Object.keys(entry).length) out[locale] = entry;
  }
  return out;
};

// Sipariş/rezervasyon kalemlerinde paket adı satış anında Türkçe kaydedilir.
// Müşteriye gösterirken paketin güncel çevirisi kullanılır (paket silinmişse
// kayıttaki ad kalır). Tüm kayıtlar için tek sorgu.
export const localizeRecordItems = async (records, locale) => {
  if (locale === DEFAULT_LOCALE || !records?.length) return records;
  const slugs = [...new Set(records.flatMap((r) => r.items?.map((i) => i.packageId) ?? []))];
  if (!slugs.length) return records;
  try {
    const packages = await prisma.package.findMany({
      where: { slug: { in: slugs } },
      select: { slug: true, name: true, translations: true },
    });
    const names = new Map(packages.map((p) => [p.slug, localize(p, locale, ["name"]).name]));
    return records.map((r) => ({
      ...r,
      items: r.items?.map((i) => ({ ...i, packageName: names.get(i.packageId) ?? i.packageName })),
    }));
  } catch (err) {
    console.error("[i18n] Paket adları çevrilemedi:", err);
    return records;
  }
};

// ---------------------------------------------------------------------------
// Mesaj çevirileri
// ---------------------------------------------------------------------------

// Türkçe → { en, ru }. Sadece müşterinin görebileceği mesajlar; admin'e özel
// mesajlar Türkçe kalır.
const MESSAGES = {
  // Genel
  "Sunucu hatası": { en: "Server error", ru: "Ошибка сервера" },
  "Kayıt bulunamadı": { en: "Record not found", ru: "Запись не найдена" },
  "Bu kayıt zaten mevcut": { en: "This record already exists", ru: "Такая запись уже существует" },
  "Tüm zorunlu alanları doldurun": { en: "Please fill in all required fields", ru: "Заполните все обязательные поля" },
  "Zorunlu alanlar eksik": { en: "Required fields are missing", ru: "Не заполнены обязательные поля" },
  "Güncellenecek alan yok": { en: "Nothing to update", ru: "Нет данных для обновления" },
  "Çok fazla deneme, lütfen daha sonra tekrar deneyin": {
    en: "Too many attempts, please try again later",
    ru: "Слишком много попыток, попробуйте позже",
  },

  // Doğrulama
  "Şifre en az 8 karakter olmalı": { en: "Password must be at least 8 characters", ru: "Пароль должен содержать не менее 8 символов" },
  "Yeni şifre en az 8 karakter olmalı": { en: "New password must be at least 8 characters", ru: "Новый пароль должен содержать не менее 8 символов" },
  "Ad soyad 2-100 karakter arasında olmalı": { en: "Full name must be 2-100 characters", ru: "Имя и фамилия должны содержать 2–100 символов" },
  "Sporcu adı 2-100 karakter arasında olmalı": { en: "Athlete name must be 2-100 characters", ru: "Имя спортсменки должно содержать 2–100 символов" },
  "Kulüp adı 2-100 karakter arasında olmalı": { en: "Club name must be 2-100 characters", ru: "Название клуба должно содержать 2–100 символов" },
  "Geçersiz telefon numarası": { en: "Invalid phone number", ru: "Неверный номер телефона" },
  "Geçersiz e-posta adresi": { en: "Invalid email address", ru: "Неверный адрес эл. почты" },

  // Hesap
  "E-posta/kullanıcı adı ve şifre gerekli": { en: "Email and password are required", ru: "Введите эл. почту и пароль" },
  "E-posta/kullanıcı adı veya şifre hatalı": { en: "Incorrect email or password", ru: "Неверная эл. почта или пароль" },
  "Sporcu adı, kulüp, doğum yılı, telefon, e-posta ve şifre gerekli": {
    en: "Athlete name, club, birth year, phone, email and password are required",
    ru: "Укажите имя спортсменки, клуб, год рождения, телефон, эл. почту и пароль",
  },
  "Bu e-posta ile kayıtlı bir hesap var": { en: "An account with this email already exists", ru: "Аккаунт с этой эл. почтой уже существует" },
  "Kullanıcı bulunamadı": { en: "User not found", ru: "Пользователь не найден" },
  "Doğrulama bağlantısı geçersiz": { en: "Invalid verification link", ru: "Неверная ссылка подтверждения" },
  "Doğrulama bağlantısı geçersiz veya süresi dolmuş": { en: "The verification link is invalid or has expired", ru: "Ссылка подтверждения недействительна или устарела" },
  "E-posta adresiniz doğrulandı": { en: "Your email address has been verified", ru: "Ваша эл. почта подтверждена" },
  "Hesabınızda e-posta adresi yok": { en: "Your account has no email address", ru: "В вашем аккаунте не указана эл. почта" },
  "Bu hesapta e-posta adresi yok": { en: "This account has no email address", ru: "В этом аккаунте не указана эл. почта" },
  "E-posta adresiniz zaten doğrulanmış": { en: "Your email address is already verified", ru: "Ваша эл. почта уже подтверждена" },
  "Doğrulama maili gönderildi": { en: "Verification email sent", ru: "Письмо для подтверждения отправлено" },
  "Bu e-posta kayıtlıysa şifre sıfırlama bağlantısı gönderildi": {
    en: "If this email is registered, a password reset link has been sent",
    ru: "Если эта эл. почта зарегистрирована, мы отправили ссылку для сброса пароля",
  },
  "Sıfırlama bağlantısı geçersiz": { en: "Invalid reset link", ru: "Неверная ссылка для сброса" },
  "Sıfırlama bağlantısı geçersiz veya süresi dolmuş": { en: "The reset link is invalid or has expired", ru: "Ссылка для сброса недействительна или устарела" },
  "Şifreniz güncellendi, giriş yapabilirsiniz": { en: "Your password has been updated, you can now sign in", ru: "Пароль обновлён, теперь вы можете войти" },
  "Şifreniz güncellendi": { en: "Your password has been updated", ru: "Пароль обновлён" },
  "Mevcut ve yeni şifre gerekli": { en: "Current and new password are required", ru: "Введите текущий и новый пароль" },
  "Mevcut şifreniz hatalı": { en: "Your current password is incorrect", ru: "Текущий пароль неверен" },
  "Hesabınızda şifre tanımlı değil, 'şifremi unuttum' ile belirleyin": {
    en: "Your account has no password yet, please set one via 'Forgot password'",
    ru: "У вашего аккаунта ещё нет пароля — задайте его через «Забыли пароль»",
  },
  "Sipariş veya rezervasyon bilgisi gerekli": { en: "Order or booking details are required", ru: "Нужны данные заказа или брони" },
  "Bu kayda bağlı bir hesap yok": { en: "No account is linked to this record", ru: "К этой записи не привязан аккаунт" },
  "Bu işlemin süresi doldu, 'şifremi unuttum' ile şifrenizi belirleyebilirsiniz": {
    en: "This action has expired, you can set your password via 'Forgot password'",
    ru: "Срок действия истёк — задайте пароль через «Забыли пароль»",
  },
  "Bağlantı oluşturulamadı, tekrar deneyin": { en: "Could not create the link, please try again", ru: "Не удалось создать ссылку, попробуйте ещё раз" },

  // Paket / sepet
  "Paket bulunamadı": { en: "Package not found", ru: "Пакет не найден" },
  "Maksimum 50 ürün eklenebilir": { en: "You can add up to 50 items", ru: "Можно добавить не более 50 позиций" },
  "Aletler liste formatında olmalı": { en: "Apparatus must be a list", ru: "Предметы должны быть указаны списком" },
  "En az bir alet seçmelisiniz": { en: "Please select at least one apparatus", ru: "Выберите хотя бы один предмет" },
  "Alet seçimi geçersiz": { en: "Invalid apparatus selection", ru: "Неверный выбор предметов" },

  // Rezervasyon / sipariş
  "Rezervasyon bulunamadı": { en: "Booking not found", ru: "Бронь не найдена" },
  "Rezervasyon oluşturuldu": { en: "Booking created", ru: "Бронь создана" },
  "Rezervasyon güncellendi": { en: "Booking updated", ru: "Бронь обновлена" },
  "Rezervasyon silindi": { en: "Booking deleted", ru: "Бронь удалена" },
  "Bu rezervasyon artık değiştirilemez. Değişiklik için bizimle iletişime geçin.": {
    en: "This booking can no longer be changed. Please contact us to make changes.",
    ru: "Эту бронь уже нельзя изменить. Для изменений свяжитесь с нами.",
  },
  "Sipariş bulunamadı": { en: "Order not found", ru: "Заказ не найден" },
  "Seçili dosya yok": { en: "No files selected", ru: "Файлы не выбраны" },
  "Lütfen alet ve poz seçin": { en: "Please choose an apparatus and a pose", ru: "Пожалуйста, выберите предмет и позу" },
  "Seçilen poz artık mevcut değil, lütfen başka bir poz seçin": { en: "The selected pose is no longer available, please choose another one", ru: "Выбранная поза больше недоступна, выберите другую" },
  "Bu ürün şu an satışta değil": { en: "This product is not on sale right now", ru: "Этот товар сейчас не продаётся" },
  "Ürün bulunamadı": { en: "Product not found", ru: "Товар не найден" },
  "Alıcı adı soyadı gerekli": { en: "Recipient's full name is required", ru: "Укажите имя и фамилию получателя" },
  "İl ve ilçe gerekli": { en: "Province and district are required", ru: "Укажите город и район" },
  "Açık adres en az 10 karakter olmalı": { en: "The full address must be at least 10 characters", ru: "Полный адрес должен содержать не менее 10 символов" },
  "Ödeme için hesabınızda e-posta adresi olmalı": { en: "Your account needs an email address to pay", ru: "Для оплаты в аккаунте должен быть указан e-mail" },
  "Ödeme formu oluşturulamadı": { en: "The payment form could not be created", ru: "Не удалось создать форму оплаты" },
  "Sipariş oluşturuldu": { en: "Order created", ru: "Заказ создан" },

  // Ödeme
  "Order ID gerekli": { en: "Order ID is required", ru: "Нужен номер заказа" },
  "Geçersiz Order ID formatı": { en: "Invalid order ID format", ru: "Неверный формат номера заказа" },
  "Geçersiz sipariş ID": { en: "Invalid order ID", ru: "Неверный номер заказа" },
  "Geçersiz sipariş ID formatı": { en: "Invalid order ID format", ru: "Неверный формат номера заказа" },
  "Bu sipariş zaten ödenmiş": { en: "This order has already been paid", ru: "Этот заказ уже оплачен" },
  "Bu sipariş için ödeme yapılamaz": { en: "This order cannot be paid", ru: "Этот заказ нельзя оплатить" },
  "Sipariş içeriği bulunamadı": { en: "Order contents not found", ru: "Состав заказа не найден" },
  "Puan bakiyeniz bu indirim için artık yetersiz. Lütfen sepetinizden yeniden sipariş oluşturun.": {
    en: "Your points balance is no longer enough for this discount. Please place the order again from your cart.",
    ru: "Ваших баллов больше не хватает для этой скидки. Оформите заказ из корзины заново.",
  },
  "Sipariş fiyatında tutarsızlık tespit edildi": { en: "A price mismatch was detected in the order", ru: "Обнаружено расхождение в цене заказа" },
  "Ödeme başlatılamadı": { en: "Payment could not be started", ru: "Не удалось начать оплату" },
  // iyzico dönüşü (sonuç sayfası adresindeki hata metni)
  "Token bulunamadı": { en: "Payment token missing", ru: "Отсутствует токен оплаты" },
  "Geçersiz token": { en: "Invalid payment token", ru: "Неверный токен оплаты" },
  "Sipariş bilgisi bulunamadı": { en: "Order details not found", ru: "Данные заказа не найдены" },
  "Ödeme doğrulama hatası": { en: "Payment verification error", ru: "Ошибка проверки оплаты" },
  "Ödeme tutarı doğrulanamadı": { en: "The payment amount could not be verified", ru: "Не удалось подтвердить сумму оплаты" },
  "Ödeme işlemi başarısız oldu": { en: "The payment failed", ru: "Оплата не прошла" },
  "Bir hata oluştu": { en: "Something went wrong", ru: "Произошла ошибка" },

  // Galeri
  "Fotoğraf bulunamadı": { en: "Photo not found", ru: "Фото не найдено" },
  "İndirilecek dosya bulunamadı": { en: "No files to download", ru: "Нет файлов для скачивания" },
  "Bu fotoğrafa erişim yetkiniz yok": { en: "You don't have access to this photo", ru: "У вас нет доступа к этому фото" },
  "Görsel bulunamadı": { en: "Image not found", ru: "Изображение не найдено" },
  "Ödül töreni bulunamadı": { en: "Award ceremony not found", ru: "Награждение не найдено" },
};

// Değişken içeren mesajlar: [kalıp, (eşleşme) => { en, ru }]
const PATTERNS = [
  [
    /^En fazla (\d+) dosya seçilebilir$/,
    ([, n]) => ({ en: `You can select up to ${n} files`, ru: `Можно выбрать не более ${n} файлов` }),
  ],
  [
    /^Zorunlu alan eksik: (.+)$/,
    ([, field]) => ({ en: `Required field missing: ${field}`, ru: `Не заполнено обязательное поле: ${field}` }),
  ],
  [
    /^(.+) için zaten bir rezervasyonunuz var\. Profilinizden düzenleyebilirsiniz\.$/,
    ([, name]) => ({
      en: `You already have a booking for ${name}. You can edit it from your profile.`,
      ru: `У вас уже есть бронь для ${name}. Её можно изменить в профиле.`,
    }),
  ],
  [
    /^(.+) için bu e-posta ile zaten bir rezervasyon var\. Giriş yapıp profilinizden düzenleyebilirsiniz\.$/,
    ([, name]) => ({
      en: `There is already a booking for ${name} with this email. Sign in to edit it from your profile.`,
      ru: `Для ${name} с этой эл. почтой уже есть бронь. Войдите, чтобы изменить её в профиле.`,
    }),
  ],
  [
    /^(.+) paketinde öncelikli seçeneği yok$/,
    ([, name]) => ({
      en: `Priority delivery is not available for the ${name} package`,
      ru: `Для пакета ${name} приоритетная доставка недоступна`,
    }),
  ],
  [
    /^Paket bulunamadı: (.+)$/,
    ([, id]) => ({ en: `Package not found: ${id}`, ru: `Пакет не найден: ${id}` }),
  ],
  [
    /^Paket ID eksik \((\d+)\. satır\)$/,
    ([, n]) => ({ en: `Package ID missing (item ${n})`, ru: `Не указан пакет (позиция ${n})` }),
  ],
  [
    /^Geçersiz seri sayısı \((\d+)\. satır\)$/,
    ([, n]) => ({ en: `Invalid number of routines (item ${n})`, ru: `Неверное число выступлений (позиция ${n})` }),
  ],
  [
    /^Geçersiz adet \((\d+)\. satır\)$/,
    ([, n]) => ({ en: `Invalid quantity (item ${n})`, ru: `Неверное количество (позиция ${n})` }),
  ],
  [
    /^Geçersiz alet: (.+)$/,
    ([, a]) => ({ en: `Invalid apparatus: ${a}`, ru: `Неверный предмет: ${a}` }),
  ],
  [
    /^Seri sayısı kadar farklı alet seçmelisiniz \(beklenen: (\d+), alınan: (\d+)\)$/,
    ([, exp, got]) => ({
      en: `Select one different apparatus per routine (expected: ${exp}, received: ${got})`,
      ru: `Выберите по одному предмету на каждое выступление (нужно: ${exp}, выбрано: ${got})`,
    }),
  ],
  [
    // items.js: "2. paket: <iç mesaj>" — iç mesaj da çevrilir
    /^(\d+)\. paket: (.+)$/,
    ([, n, inner], locale) => {
      const t = translateMessage(inner, locale);
      return { en: `Package ${n}: ${t}`, ru: `Пакет ${n}: ${t}` };
    },
  ],
];

export const translateMessage = (message, locale) => {
  if (typeof message !== "string" || locale === DEFAULT_LOCALE) return message;
  const exact = MESSAGES[message];
  if (exact) return exact[locale] ?? message;
  for (const [re, build] of PATTERNS) {
    const m = message.match(re);
    if (m) return build(m, locale)[locale] ?? message;
  }
  return message;
};

// res.json'u sarar: gövdedeki `message` istek diline çevrilir.
export const translateResponses = (req, res, next) => {
  const locale = getLocale(req);
  req.locale = locale;
  if (locale !== DEFAULT_LOCALE) {
    const json = res.json.bind(res);
    res.json = (body) => {
      if (body && typeof body === "object" && typeof body.message === "string") {
        body = { ...body, message: translateMessage(body.message, locale) };
      }
      return json(body);
    };
  }
  next();
};
