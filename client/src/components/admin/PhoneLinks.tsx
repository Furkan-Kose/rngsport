import { MessageCircle, Phone } from 'lucide-react';
import { whatsappNumber } from '../../lib/whatsapp';

/** Telefon numarası: tıklayınca arar (tel:), yanında WhatsApp sohbeti açan buton. */
const PhoneLinks = ({ phone, className = '' }: { phone?: string | null; className?: string }) => {
  if (!phone) return <span className="text-gray-400">-</span>;
  const wa = whatsappNumber(phone);
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <a
        href={`tel:${phone.replace(/[^\d+]/g, '')}`}
        className="inline-flex items-center gap-1 text-gray-200 hover:text-amber-400 transition-colors"
        title="Ara"
        onClick={(e) => e.stopPropagation()}
      >
        <Phone className="w-3.5 h-3.5 text-gray-400" />
        {phone}
      </a>
      {wa && (
        <a
          href={`https://wa.me/${wa}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-emerald-400 hover:bg-emerald-500/15 transition-colors"
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
