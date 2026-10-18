import { Resend } from "resend";
import { env } from "../utils/env.js";
import { localizeRecordItems, normalizeLocale } from "../utils/i18n.js";

// Panele .env'den kopyalanan değer tırnaklarıyla gelebiliyor ("RNG Sport <...>");
// Railway bunları değerin parçası sayar ve Resend from alanını 422 ile reddeder.
const unquote = (value) => value?.replace(/^(["'])(.*)\1$/, "$2");

// MAIL_FROM tanımsızsa Resend'in paylaşımlı test adresine düşülür. DİKKAT: o adres
// SADECE Resend hesabının kendi e-postasına gönderim yapabilir; başka bir alıcıya
// gönderim 403 ile reddedilir ve sendSafe hatayı yuttuğu için sessizce kaybolur.
// Canlıda mutlaka doğrulanmış bir alan adı kullanılmalı.
const FROM = unquote(env("MAIL_FROM")) || "RNG Sport <onboarding@resend.dev>";
// Gönderen adres bir posta kutusu olmayabilir (ör. bilgi@rngsport.com). Tanımlıysa
// müşterinin "Yanıtla"sı gerçek bir kutuya düşer; tanımsızsa davranış değişmez.
const REPLY_TO = unquote(env("MAIL_REPLY_TO"));
const FRONTEND_URL = env("FRONTEND_URL") || "http://localhost:5173";

const RESEND_API_KEY = unquote(env("RESEND_API_KEY"));
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
if (resend) console.log(`[mail] Resend hazır, gönderen: ${FROM}`);

// Mail hatası hiçbir API isteğini bozmamalı: asla throw etmez, sadece loglar.
const sendSafe = async ({ to, subject, html }) => {
  if (!resend) {
    console.warn(`[mail] RESEND_API_KEY tanımlı değil, mail atlandı: "${subject}" → ${to}`);
    return;
  }
  try {
    // replyTo: resend SDK 6.x camelCase bekliyor
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      ...(REPLY_TO && { replyTo: REPLY_TO }),
    });
    if (error) {
      console.error(`[mail] Gönderim hatası ("${subject}" → ${to}):`, error);
    }
  } catch (err) {
    console.error(`[mail] Gönderim hatası ("${subject}" → ${to}):`, err);
  }
};

// ---------------------------------------------------------------------------
// Metinler (tr / en / ru). Rezervasyon/sipariş mailleri kaydın dilinde
// (Reservation/Order.locale), şifre/doğrulama mailleri isteğin dilinde gider.
// ---------------------------------------------------------------------------
const TEXT = {
  tr: {
    rights: "Tüm hakları saklıdır.",
    buttonFallback: "Buton çalışmazsa bu bağlantıyı tarayıcınıza yapıştırın:",
    hello: (n) => (n ? `Merhaba ${n},` : "Merhaba,"),
    verify: {
      subject: "E-posta adresinizi doğrulayın",
      title: "E-posta Adresinizi Doğrulayın",
      body: "RNG Sport hesabınızı oluşturduğunuz için teşekkürler. Hesabınızın size ait olduğunu doğrulamak için aşağıdaki butona tıklayın.",
      button: "E-postamı Doğrula",
      footer: "Bu bağlantı 24 saat geçerlidir. Bu hesabı siz oluşturmadıysanız bu e-postayı yok sayabilirsiniz.",
    },
    reset: {
      subjectFirst: "Şifrenizi belirleyin",
      subject: "Şifre sıfırlama talebi",
      titleFirst: "Şifrenizi Belirleyin",
      title: "Şifre Sıfırlama",
      bodyFirst: "Rezervasyonunuzla birlikte hesabınız oluşturuldu. Fotoğraflarınıza ulaşabilmek için aşağıdaki butondan şifrenizi belirleyin.",
      body: "Hesabınız için bir şifre sıfırlama talebi aldık. Yeni şifrenizi belirlemek için aşağıdaki butona tıklayın.",
      buttonFirst: "Şifremi Belirle",
      button: "Şifremi Sıfırla",
      footer: "Bu bağlantı 1 saat geçerlidir. Bu talebi siz yapmadıysanız bu e-postayı yok sayabilirsiniz; şifreniz değişmez.",
    },
    delivery: {
      subject: "Fotoğraflarınız hazır! 🎉",
      title: "Fotoğraflarınız Hazır! 🎉",
      body: "Çekiminiz tamamlandı ve fotoğraflarınız hesabınıza yüklendi.",
      bodyClaim: "Galerinize ulaşmak için önce şifrenizi belirleyin.",
      bodyOpen: "Aşağıdaki butondan galerinize ulaşıp fotoğraflarınızı görüntüleyebilir ve indirebilirsiniz.",
      buttonClaim: "Şifremi Belirle ve Galerime Git",
      button: "Fotoğraflarımı Gör",
      footerClaim: "Bu bağlantı 7 gün geçerlidir. Süresi dolarsa giriş ekranındaki “Şifremi unuttum” bağlantısını kullanabilirsiniz.",
      footer: (url) => `Galerinize <a href="${url}" style="color:#059669;">giriş yaparak</a> istediğiniz zaman ulaşabilirsiniz.`,
    },
    items: { priority: "Öncelikli", series: (n) => `${n} seri`, total: "Toplam" },
    reservation: {
      subject: "Rezervasyonunuz alındı",
      title: "Rezervasyonunuz Alındı",
      body: "Rezervasyonunuz oluşturuldu. Ödemenizi yarışma günü alandaki standımızda yapabilirsiniz.",
      afterClaim: "Fotoğraflarınız çekim sonrası hesabınıza yüklenecek. Hesabınıza ulaşmak için şifrenizi belirleyin.",
      after: "Fotoğraflarınız çekim sonrası hesabınıza yüklenecek ve size haber vereceğiz.",
      setPassword: "Şifremi Belirle",
      number: "Rezervasyon No",
    },
    order: {
      subject: "Siparişiniz alındı",
      title: "Ödemeniz Başarıyla Alındı",
      body: "Siparişiniz için teşekkürler! Ödemeniz başarıyla alındı, çekiminiz planlandığı şekilde gerçekleştirilecek.",
      after: "Fotoğraflarınız hazır olduğunda size tekrar e-posta göndereceğiz.",
      afterClaim: " Hesabınıza şimdiden ulaşmak için şifrenizi belirleyebilirsiniz.",
      setPassword: "Şifremi Belirle",
      number: "Sipariş No",
    },
  },
  en: {
    rights: "All rights reserved.",
    buttonFallback: "If the button doesn't work, paste this link into your browser:",
    hello: (n) => (n ? `Hello ${n},` : "Hello,"),
    verify: {
      subject: "Verify your email address",
      title: "Verify Your Email Address",
      body: "Thank you for creating your RNG Sport account. Click the button below to confirm that this account belongs to you.",
      button: "Verify My Email",
      footer: "This link is valid for 24 hours. If you didn't create this account, you can ignore this email.",
    },
    reset: {
      subjectFirst: "Set your password",
      subject: "Password reset request",
      titleFirst: "Set Your Password",
      title: "Password Reset",
      bodyFirst: "Your account was created together with your booking. Set your password using the button below to access your photos.",
      body: "We received a request to reset the password for your account. Click the button below to choose a new password.",
      buttonFirst: "Set My Password",
      button: "Reset My Password",
      footer: "This link is valid for 1 hour. If you didn't make this request, you can ignore this email; your password will not change.",
    },
    delivery: {
      subject: "Your photos are ready! 🎉",
      title: "Your Photos Are Ready! 🎉",
      body: "Your shoot is complete and your photos have been uploaded to your account.",
      bodyClaim: "Please set your password first to access your gallery.",
      bodyOpen: "Use the button below to open your gallery, view and download your photos.",
      buttonClaim: "Set Password and Open My Gallery",
      button: "View My Photos",
      footerClaim: "This link is valid for 7 days. If it expires, use the “Forgot password” link on the sign-in page.",
      footer: (url) => `You can access your gallery any time by <a href="${url}" style="color:#059669;">signing in</a>.`,
    },
    items: { priority: "Priority", series: (n) => `${n} ${n === 1 ? "routine" : "routines"}`, total: "Total" },
    reservation: {
      subject: "Your booking has been received",
      title: "Your Booking Has Been Received",
      body: "Your booking has been created. You can pay at our stand at the venue on competition day.",
      afterClaim: "Your photos will be uploaded to your account after the shoot. Set your password to access your account.",
      after: "Your photos will be uploaded to your account after the shoot and we will let you know.",
      setPassword: "Set My Password",
      number: "Booking No",
    },
    order: {
      subject: "Your order has been received",
      title: "Your Payment Was Successful",
      body: "Thank you for your order! Your payment was received and your shoot will take place as planned.",
      after: "We will email you again when your photos are ready.",
      afterClaim: " You can already set your password to access your account.",
      setPassword: "Set My Password",
      number: "Order No",
    },
  },
  ru: {
    rights: "Все права защищены.",
    buttonFallback: "Если кнопка не работает, вставьте эту ссылку в браузер:",
    hello: (n) => (n ? `Здравствуйте, ${n}!` : "Здравствуйте!"),
    verify: {
      subject: "Подтвердите адрес эл. почты",
      title: "Подтвердите адрес эл. почты",
      body: "Спасибо за регистрацию в RNG Sport. Нажмите кнопку ниже, чтобы подтвердить, что этот аккаунт принадлежит вам.",
      button: "Подтвердить эл. почту",
      footer: "Ссылка действительна 24 часа. Если вы не создавали этот аккаунт, просто проигнорируйте это письмо.",
    },
    reset: {
      subjectFirst: "Задайте пароль",
      subject: "Запрос на сброс пароля",
      titleFirst: "Задайте пароль",
      title: "Сброс пароля",
      bodyFirst: "Вместе с бронью для вас был создан аккаунт. Задайте пароль с помощью кнопки ниже, чтобы получить доступ к фото.",
      body: "Мы получили запрос на сброс пароля вашего аккаунта. Нажмите кнопку ниже, чтобы задать новый пароль.",
      buttonFirst: "Задать пароль",
      button: "Сбросить пароль",
      footer: "Ссылка действительна 1 час. Если вы не отправляли этот запрос, проигнорируйте письмо — пароль не изменится.",
    },
    delivery: {
      subject: "Ваши фото готовы! 🎉",
      title: "Ваши фото готовы! 🎉",
      body: "Съёмка завершена, фото загружены в ваш аккаунт.",
      bodyClaim: "Чтобы открыть галерею, сначала задайте пароль.",
      bodyOpen: "Нажмите кнопку ниже, чтобы открыть галерею, посмотреть и скачать фото.",
      buttonClaim: "Задать пароль и открыть галерею",
      button: "Смотреть мои фото",
      footerClaim: "Ссылка действительна 7 дней. Если срок истёк, воспользуйтесь ссылкой «Забыли пароль» на странице входа.",
      footer: (url) => `Галерея всегда доступна после <a href="${url}" style="color:#059669;">входа в аккаунт</a>.`,
    },
    items: { priority: "Приоритет", series: (n) => `выступлений: ${n}`, total: "Итого" },
    reservation: {
      subject: "Ваша бронь получена",
      title: "Ваша бронь получена",
      body: "Бронь оформлена. Оплатить можно на нашем стенде в день соревнований.",
      afterClaim: "После съёмки фото будут загружены в ваш аккаунт. Задайте пароль, чтобы войти в аккаунт.",
      after: "После съёмки фото будут загружены в ваш аккаунт, и мы сообщим вам об этом.",
      setPassword: "Задать пароль",
      number: "Номер брони",
    },
    order: {
      subject: "Ваш заказ получен",
      title: "Оплата прошла успешно",
      body: "Спасибо за заказ! Оплата получена, съёмка пройдёт по плану.",
      after: "Мы снова напишем вам, когда фото будут готовы.",
      afterClaim: " Уже сейчас вы можете задать пароль для входа в аккаунт.",
      setPassword: "Задать пароль",
      number: "Номер заказа",
    },
  },
};

const NUMBER_LOCALES = { tr: "tr-TR", en: "en-GB", ru: "ru-RU" };

// Sitenin o dildeki adresi: /galerim → /en/galerim (Türkçe öneksiz)
const siteUrl = (locale, path) =>
  `${FRONTEND_URL}${locale === "tr" ? "" : `/${locale}`}${path}`;

// Basit, mail istemcisi dostu şablon (inline stil, açık tema)
const layout = (t, { title, bodyHtml, buttonText, buttonUrl, footerNote }) => `
<div style="margin:0;padding:24px;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
    <div style="background:#09090b;padding:20px 28px;">
      <span style="color:#10b981;font-size:20px;font-weight:bold;">RNG Sport</span>
    </div>
    <div style="padding:28px;">
      <h1 style="margin:0 0 16px;font-size:20px;color:#18181b;">${title}</h1>
      <div style="font-size:15px;line-height:1.6;color:#3f3f46;">${bodyHtml}</div>
      ${
        buttonText && buttonUrl
          ? `<div style="margin:28px 0;">
               <a href="${buttonUrl}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:12px 28px;border-radius:10px;">${buttonText}</a>
             </div>
             <p style="font-size:12px;color:#a1a1aa;">${t.buttonFallback}<br/>
               <a href="${buttonUrl}" style="color:#059669;word-break:break-all;">${buttonUrl}</a></p>`
          : ""
      }
      ${footerNote ? `<p style="font-size:13px;color:#71717a;margin-top:20px;">${footerNote}</p>` : ""}
    </div>
    <div style="padding:16px 28px;background:#fafafa;border-top:1px solid #e4e4e7;">
      <p style="margin:0;font-size:12px;color:#a1a1aa;">© ${new Date().getFullYear()} Range Media. ${t.rights}</p>
    </div>
  </div>
</div>`;

// Otomatik açılan (şifresiz) hesaplar için "şifreni belirle" bağlantısı.
// token null ise hesap zaten sahiplenilmiş demektir — buton çıkmaz.
const setPasswordUrl = (token, locale) =>
  token ? siteUrl(locale, `/sifre-sifirla?token=${token}&yeni=1`) : null;

export const sendVerificationEmail = (to, name, token, locale) => {
  const lang = normalizeLocale(locale);
  const t = TEXT[lang];
  return sendSafe({
    to,
    subject: `${t.verify.subject} | RNG Sport`,
    html: layout(t, {
      title: t.verify.title,
      bodyHtml: `<p>${t.hello(name)}</p>
        <p>${t.verify.body}</p>`,
      buttonText: t.verify.button,
      buttonUrl: siteUrl(lang, `/eposta-dogrula?token=${token}`),
      footerNote: t.verify.footer,
    }),
  });
};

// isFirstTime: hesap sipariş/rezervasyonla otomatik açıldı ve henüz şifresi yok —
// "sıfırlama" metni o hesapta anlamsız olurdu.
export const sendPasswordResetEmail = (to, name, token, { isFirstTime = false, locale } = {}) => {
  const lang = normalizeLocale(locale);
  const t = TEXT[lang];
  return sendSafe({
    to,
    subject: `${isFirstTime ? t.reset.subjectFirst : t.reset.subject} | RNG Sport`,
    html: layout(t, {
      title: isFirstTime ? t.reset.titleFirst : t.reset.title,
      bodyHtml: `<p>${t.hello(name)}</p>
        <p>${isFirstTime ? t.reset.bodyFirst : t.reset.body}</p>`,
      buttonText: isFirstTime ? t.reset.buttonFirst : t.reset.button,
      buttonUrl: siteUrl(lang, `/sifre-sifirla?token=${token}${isFirstTime ? "&yeni=1" : ""}`),
      footerNote: t.reset.footer,
    }),
  });
};

// setPasswordToken: hesap hâlâ şifresizse verilir; müşteri tek tıkla şifresini
// belirleyip galerisine girer. Şifresi varsa null gelir, normal giriş yolu gösterilir.
// locale: teslim edilen siparişin/rezervasyonun dili.
export const sendDeliveryEmail = (to, name, setPasswordToken = null, locale) => {
  const lang = normalizeLocale(locale);
  const t = TEXT[lang];
  const claimUrl = setPasswordUrl(setPasswordToken, lang);
  return sendSafe({
    to,
    subject: `${t.delivery.subject} | RNG Sport`,
    html: layout(t, {
      title: t.delivery.title,
      bodyHtml: `<p>${t.hello(name)}</p>
        <p>${t.delivery.body} ${claimUrl ? t.delivery.bodyClaim : t.delivery.bodyOpen}</p>`,
      buttonText: claimUrl ? t.delivery.buttonClaim : t.delivery.button,
      buttonUrl: claimUrl || siteUrl(lang, "/galerim"),
      footerNote: claimUrl ? t.delivery.footerClaim : t.delivery.footer(siteUrl(lang, "/giris")),
    }),
  });
};

// Sipariş/rezervasyon kalemleri + toplam satırı
const itemsTable = (t, lang, items, totalPrice) => `
        <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;color:#3f3f46;">
          ${items
            .map(
              (item) =>
                `<tr>
           <td style="padding:6px 0;border-bottom:1px solid #f4f4f5;">${item.packageName}${item.priority ? ` <strong style="color:#d97706;">· ${t.items.priority}</strong>` : ""} <span style="color:#a1a1aa;">(${t.items.series(item.seriesCount)})</span></td>
           <td style="padding:6px 0;border-bottom:1px solid #f4f4f5;text-align:right;">× ${item.quantity}</td>
         </tr>`
            )
            .join("")}
          <tr>
            <td style="padding:10px 0;font-weight:bold;color:#18181b;">${t.items.total}</td>
            <td style="padding:10px 0;font-weight:bold;color:#18181b;text-align:right;">₺${totalPrice.toLocaleString(NUMBER_LOCALES[lang])}</td>
          </tr>
        </table>`;

// Rezervasyon oluşturulduğunda gönderilir (elden nakit akışı — ödeme yarışma günü).
// Dil: rezervasyonun yapıldığı dil (reservation.locale).
export const sendReservationCreatedEmail = async (to, reservation, setPasswordToken = null) => {
  const lang = normalizeLocale(reservation.locale);
  const t = TEXT[lang];
  const claimUrl = setPasswordUrl(setPasswordToken, lang);
  const [{ items }] = await localizeRecordItems([reservation], lang);

  return sendSafe({
    to,
    subject: `${t.reservation.subject} | RNG Sport`,
    html: layout(t, {
      title: t.reservation.title,
      bodyHtml: `<p>${t.hello(reservation.athleteName)}</p>
        <p>${t.reservation.body}</p>
        ${itemsTable(t, lang, items, reservation.totalPrice)}
        <p>${claimUrl ? t.reservation.afterClaim : t.reservation.after}</p>`,
      buttonText: claimUrl ? t.reservation.setPassword : null,
      buttonUrl: claimUrl,
      footerNote: `${t.reservation.number}: ${reservation.id}`,
    }),
  });
};

// Dil: siparişin verildiği dil (order.locale).
export const sendOrderPaidEmail = async (to, order, setPasswordToken = null) => {
  const lang = normalizeLocale(order.locale);
  const t = TEXT[lang];
  const claimUrl = setPasswordUrl(setPasswordToken, lang);
  const [{ items }] = await localizeRecordItems([order], lang);

  return sendSafe({
    to,
    subject: `${t.order.subject} | RNG Sport`,
    html: layout(t, {
      title: t.order.title,
      bodyHtml: `<p>${t.hello(order.athleteName)}</p>
        <p>${t.order.body}</p>
        ${itemsTable(t, lang, items, order.totalPrice)}
        <p>${t.order.after}${claimUrl ? t.order.afterClaim : ""}</p>`,
      buttonText: claimUrl ? t.order.setPassword : null,
      buttonUrl: claimUrl,
      footerNote: `${t.order.number}: ${order.id}`,
    }),
  });
};
