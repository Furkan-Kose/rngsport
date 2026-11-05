import { MessageCircle, Phone } from 'lucide-react';

/**
 * Telefon numarası: tıklayınca arar (tel:), yanında WhatsApp sohbeti açan buton.
 * TR numaraları 90'lı biçime çevrilir: "0532 …" → 90532…, "532 …" → 90532…; "+…" olduğu gibi kalır.
 */
const whatsappNumber = (raw: string) => {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (raw.trim().startsWith('+')) return digits;
  if (digits.startsWith('90') && digits.length === 12) return digits;
  if (digits.startsWith('0') && digits.length === 11) return `9${digits}`;
  if (digits.length === 10 && digits.startsWith('5')) return `90${digits}`;
  return digits;
};

const PhoneLinks = ({ phone, className = '' }: { phone?: string | null; className?: string }) => {
  if (!phone) return <span className="text-gray-500">-</span>;
  const wa = whatsappNumber(phone);
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <a
        href={`tel:${phone.replace(/[^\d+]/g, '')}`}
        className="inline-flex items-center gap-1 text-gray-200 hover:text-amber-400 transition-colors"
        title="Ara"
        onClick={(e) => e.stopPropagation()}
      >
        <Phone className="w-3.5 h-3.5 text-gray-500" />
        {phone}
      </a>
      {wa && (
        <a
          href={`https://wa.me/${wa}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center w-6 h-6 rounded-md text-emerald-400 hover:bg-emerald-500/15 transition-colors"
          title="WhatsApp'tan yaz"
          aria-label="WhatsApp'tan yaz"
          onClick={(e) => e.stopPropagation()}
        >
          <MessageCircle className="w-4 h-4" />
        </a>
      )}
    </span>
  );
};

export default PhoneLinks;
