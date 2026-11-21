// İletişim bilgileri tek yerde (alt bilgi, WhatsApp düğmesi, hata ekranları)
export const WHATSAPP_NUMBER = "905512217635";
export const WHATSAPP_DISPLAY = "+90 (551) 221 76 35";
export const CONTACT_EMAIL = "range.media0@gmail.com";

/** WhatsApp sohbet adresi; mesaj verilirse yazı alanına hazır gelir */
export const whatsappUrl = (message?: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
