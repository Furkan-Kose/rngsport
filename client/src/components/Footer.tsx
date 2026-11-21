import { Instagram, Mail, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import LocalizedLink from "./LocalizedLink";
import WhatsAppIcon from "./ui/WhatsAppIcon";
import { CONTACT_EMAIL, WHATSAPP_DISPLAY, whatsappUrl } from "../lib/contact";

const linkClass = "text-zinc-400 hover:text-emerald-400 transition-colors";

const Footer = () => {
  const { t } = useTranslation();

  const navLinks = [
    { name: t("common.nav.packages"), to: "/paketler" },
    { name: t("common.nav.reserve"), to: "/rezervasyon" },
    { name: t("common.nav.gallery"), to: "/galeri" },
    { name: t("common.nav.awards"), to: "/odul-torenleri" },
    { name: t("common.nav.products"), to: "/urunler" },
    { name: t("common.nav.about"), to: "/hakkimizda" },
  ];

  const legalLinks = [
    { name: t("common.legalLinks.privacy"), to: "/gizlilik-ve-guvenlik-politikasi" },
    { name: t("common.legalLinks.kvkk"), to: "/kvkk-aydinlatma-metni" },
    { name: t("common.legalLinks.distanceSales"), to: "/mesafeli-satis-sozlesmesi" },
    { name: t("common.legalLinks.refund"), to: "/iptal-ve-iade-kosullari" },
  ];

  return (
    <footer className="bg-black border-t border-zinc-800 pt-14 pb-24 sm:pb-10">
      {/* pb-24 telefonda: sabit WhatsApp butonu (sağ alt) telif satırını örtmesin */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="sm:col-span-2">
            <LocalizedLink to="/" className="inline-block mb-5" aria-label={t("common.nav.home")}>
              <img src="/logo-web.png" alt="RNG Sport" className="h-14 w-auto" />
            </LocalizedLink>
            <p className="text-zinc-400 max-w-md">{t("common.footer.about")}</p>
          </div>

          <nav aria-label={t("common.footer.quickLinks")}>
            <h2 className="font-semibold text-zinc-100 mb-4">{t("common.footer.quickLinks")}</h2>
            <ul className="space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <LocalizedLink to={link.to} className={linkClass}>
                    {link.name}
                  </LocalizedLink>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-semibold text-zinc-100 mb-4">{t("common.footer.contact")}</h2>
            <ul className="space-y-2.5">
              <li>
                <a
                  href={whatsappUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${linkClass} inline-flex items-center gap-2.5`}
                >
                  <WhatsAppIcon className="w-4 h-4 shrink-0" />
                  <span>
                    <span className="sr-only">{t("common.footer.phone")}: </span>
                    {WHATSAPP_DISPLAY}
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className={`${linkClass} inline-flex items-center gap-2.5 break-all`}
                >
                  <Mail className="w-4 h-4 shrink-0" aria-hidden />
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/range.media"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${linkClass} inline-flex items-center gap-2.5`}
                >
                  <Instagram className="w-4 h-4 shrink-0" aria-hidden />
                  Instagram
                </a>
              </li>
              <li className="text-zinc-400">{t("common.footer.location")}</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-800 flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Ödeme logoları ~340px: telefonda yazının altına iner, ekrandan geniş olmaz */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 max-w-full">
            <span className="inline-flex items-center gap-1.5 text-sm text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden />
              {t("common.footer.securePayment")}
            </span>
            <img
              src="/footerLogo.png"
              alt={t("common.footer.paymentLogosAlt")}
              className="h-8 w-auto max-w-full object-contain opacity-80"
            />
          </div>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            {legalLinks.map((link) => (
              <li key={link.to}>
                <LocalizedLink to={link.to} className={linkClass}>
                  {link.name}
                </LocalizedLink>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-center lg:text-left text-sm text-zinc-400">
          <a
            href="https://rangemedia.com.tr"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-400 transition-colors"
          >
            {t("common.footer.copyright")}
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
