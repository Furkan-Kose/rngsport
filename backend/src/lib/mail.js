import { Resend } from "resend";

const FROM = process.env.MAIL_FROM || "RNG Sport <onboarding@resend.dev>";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Mail hatası hiçbir API isteğini bozmamalı: asla throw etmez, sadece loglar.
const sendSafe = async ({ to, subject, html }) => {
  if (!resend) {
    console.warn(`[mail] RESEND_API_KEY tanımlı değil, mail atlandı: "${subject}" → ${to}`);
    return;
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error(`[mail] Gönderim hatası ("${subject}" → ${to}):`, error);
    }
  } catch (err) {
    console.error(`[mail] Gönderim hatası ("${subject}" → ${to}):`, err);
  }
};

// Basit, mail istemcisi dostu şablon (inline stil, açık tema)
const layout = ({ title, bodyHtml, buttonText, buttonUrl, footerNote }) => `
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
             <p style="font-size:12px;color:#a1a1aa;">Buton çalışmazsa bu bağlantıyı tarayıcınıza yapıştırın:<br/>
               <a href="${buttonUrl}" style="color:#059669;word-break:break-all;">${buttonUrl}</a></p>`
          : ""
      }
      ${footerNote ? `<p style="font-size:13px;color:#71717a;margin-top:20px;">${footerNote}</p>` : ""}
    </div>
    <div style="padding:16px 28px;background:#fafafa;border-top:1px solid #e4e4e7;">
      <p style="margin:0;font-size:12px;color:#a1a1aa;">© ${new Date().getFullYear()} Range Media. Tüm hakları saklıdır.</p>
    </div>
  </div>
</div>`;

const greet = (name) => (name ? `Merhaba ${name},` : "Merhaba,");

export const sendVerificationEmail = (to, name, token) =>
  sendSafe({
    to,
    subject: "E-posta adresinizi doğrulayın | RNG Sport",
    html: layout({
      title: "E-posta Adresinizi Doğrulayın",
      bodyHtml: `<p>${greet(name)}</p>
        <p>RNG Sport hesabınızı oluşturduğunuz için teşekkürler. Hesabınızın size ait olduğunu doğrulamak için aşağıdaki butona tıklayın.</p>`,
      buttonText: "E-postamı Doğrula",
      buttonUrl: `${FRONTEND_URL}/eposta-dogrula?token=${token}`,
      footerNote: "Bu bağlantı 24 saat geçerlidir. Bu hesabı siz oluşturmadıysanız bu e-postayı yok sayabilirsiniz.",
    }),
  });

export const sendPasswordResetEmail = (to, name, token) =>
  sendSafe({
    to,
    subject: "Şifre sıfırlama talebi | RNG Sport",
    html: layout({
      title: "Şifre Sıfırlama",
      bodyHtml: `<p>${greet(name)}</p>
        <p>Hesabınız için bir şifre sıfırlama talebi aldık. Yeni şifrenizi belirlemek için aşağıdaki butona tıklayın.</p>`,
      buttonText: "Şifremi Sıfırla",
      buttonUrl: `${FRONTEND_URL}/sifre-sifirla?token=${token}`,
      footerNote: "Bu bağlantı 1 saat geçerlidir. Bu talebi siz yapmadıysanız bu e-postayı yok sayabilirsiniz; şifreniz değişmez.",
    }),
  });

export const sendDeliveryEmail = (to, name) =>
  sendSafe({
    to,
    subject: "Fotoğraflarınız hazır! 🎉 | RNG Sport",
    html: layout({
      title: "Fotoğraflarınız Hazır! 🎉",
      bodyHtml: `<p>${greet(name)}</p>
        <p>Çekiminiz tamamlandı ve fotoğraflarınız hesabınıza yüklendi. Aşağıdaki butondan galerinize ulaşıp fotoğraflarınızı görüntüleyebilir ve indirebilirsiniz.</p>`,
      buttonText: "Fotoğraflarımı Gör",
      buttonUrl: `${FRONTEND_URL}/galerim`,
      footerNote: `Henüz bir hesabınız yoksa bu e-posta adresiyle <a href="${FRONTEND_URL}/kayit" style="color:#059669;">kayıt olduktan</a> sonra fotoğraflarınız hesabınıza tanımlanacaktır.`,
    }),
  });

export const sendOrderPaidEmail = (to, order) => {
  const itemsHtml = order.items
    .map(
      (item) =>
        `<tr>
           <td style="padding:6px 0;border-bottom:1px solid #f4f4f5;">${item.packageName} <span style="color:#a1a1aa;">(${item.seriesCount} seri)</span></td>
           <td style="padding:6px 0;border-bottom:1px solid #f4f4f5;text-align:right;">× ${item.quantity}</td>
         </tr>`
    )
    .join("");

  return sendSafe({
    to,
    subject: "Siparişiniz alındı | RNG Sport",
    html: layout({
      title: "Ödemeniz Başarıyla Alındı",
      bodyHtml: `<p>${greet(order.athleteName)}</p>
        <p>Siparişiniz için teşekkürler! Ödemeniz başarıyla alındı, çekiminiz planlandığı şekilde gerçekleştirilecek.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;color:#3f3f46;">
          ${itemsHtml}
          <tr>
            <td style="padding:10px 0;font-weight:bold;color:#18181b;">Toplam</td>
            <td style="padding:10px 0;font-weight:bold;color:#18181b;text-align:right;">₺${order.totalPrice.toLocaleString("tr-TR")}</td>
          </tr>
        </table>
        <p>Fotoğraflarınız hazır olduğunda size tekrar e-posta göndereceğiz.</p>`,
      footerNote: `Sipariş No: ${order.id}`,
    }),
  });
};
