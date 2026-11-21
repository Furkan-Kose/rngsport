/**
 * wa.me için numara: TR numaraları 90'lı biçime çevrilir: "0532 …" → 90532…, "532 …" → 90532…;
 * "+…" olduğu gibi kalır. Boş dönerse numara yok demektir.
 */
export const whatsappNumber = (raw: string) => {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (raw.trim().startsWith('+')) return digits;
  if (digits.startsWith('90') && digits.length === 12) return digits;
  if (digits.startsWith('0') && digits.length === 11) return `9${digits}`;
  if (digits.length === 10 && digits.startsWith('5')) return `90${digits}`;
  return digits;
};

/** WhatsApp'ta hazır mesajla sohbet aç; numara yoksa kişi seçme ekranı açılır */
export const whatsappShareUrl = (text: string, phone?: string | null) => {
  const wa = phone ? whatsappNumber(phone) : '';
  return `https://wa.me/${wa}?text=${encodeURIComponent(text)}`;
};
