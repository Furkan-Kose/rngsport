import { Instagram, Mail, Phone, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import LocalizedLink from "./LocalizedLink";
import { useLocalizedPath } from "../lib/localePath";

const Footer = () => {
  const { t } = useTranslation();
  const localize = useLocalizedPath();

  const socialLinks = [
    {
      label: "Instagram",
      href: "https://www.instagram.com/range.media",
      icon: Instagram,
      external: true,
    },
    { label: t("common.footer.email"), href: "mailto:range.media0@gmail.com", icon: Mail },
    { label: t("common.footer.phone"), href: "tel:+905423406557", icon: Phone },
  ];

  const navLinks = [
    { name: t("common.nav.home"), href: localize("/#") },
    { name: t("common.nav.about"), href: localize("/hakkimizda") },
    { name: t("common.nav.gallery"), href: localize("/galeri") },
    { name: t("common.nav.awards"), href: localize("/odul-torenleri") },
    { name: t("common.nav.products"), href: localize("/urunler") },
    { name: t("common.nav.packages"), href: localize("/paketler") },
  ];

  return (
    <footer id="contact" className="relative pt-16 pb-10">
      {/* Animated gradient top edge */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-emerald-500/50 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-px bg-emerald-400/60 blur-[2px]" />

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo & About */}
          <div className="md:col-span-2">
            <a href="#home" className="flex items-center gap-3 mb-6 group">
              <img
                src="/logo-web.png"
                alt="RNG Sport"
                className="h-16 w-auto transition-transform duration-300 group-hover:scale-105"
              />
            </a>
            <p className="text-gray-400 max-w-md mb-6 leading-relaxed">
              {t("common.footer.about")}
            </p>
            <div className="flex gap-3">
              {socialLinks.map(({ label, href, icon: Icon, external }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  title={label}
                  {...(external && {
                    target: "_blank",
                    rel: "noopener noreferrer",
                  })}
                  className="w-10 h-10 rounded-full bg-zinc-900/70 backdrop-blur border border-white/10 shadow-lg flex items-center justify-center text-gray-400 hover:text-emerald-400 hover:border-emerald-500/60 hover:bg-emerald-500/10 hover:shadow-[0_0_18px_rgba(16,185,129,0.35)] hover:scale-110 transition-all duration-300"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-gray-100 mb-6 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-emerald-500" />
              {t("common.footer.quickLinks")}
            </h4>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-emerald-400 hover:translate-x-1 inline-block transition-all duration-300"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-gray-100 mb-6 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-emerald-500" />
              {t("common.footer.contact")}
            </h4>
            <ul className="space-y-3 text-gray-400">
              <li className="hover:text-emerald-400 transition-colors">
                +90 (542) 340 65 57
              </li>
              <li>{t("common.footer.location")}</li>
            </ul>
          </div>
        </div>

        {/* Secure payment + logos */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-300">
              {t("common.footer.securePayment")}
            </span>
          </div>
          <img
            src="/footerLogo.png"
            alt={t("common.footer.paymentLogosAlt")}
            className="h-10 opacity-70 hover:opacity-100 transition-opacity"
          />
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <a
            href="https://rangemedia.com.tr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-400 hover:text-emerald-400 transition-colors"
          >
            {t("common.footer.copyright")}
          </a>
          <div className="flex flex-col md:flex-row gap-2 md:gap-6 text-sm text-gray-400">
            <LocalizedLink
              to="/gizlilik-ve-guvenlik-politikasi"
              className="hover:text-emerald-400 transition-colors"
            >
              {t("common.legalLinks.privacy")}
            </LocalizedLink>
            <LocalizedLink
              to="/kvkk-aydinlatma-metni"
              className="hover:text-emerald-400 transition-colors"
            >
              {t("common.legalLinks.kvkk")}
            </LocalizedLink>
            <LocalizedLink
              to="/mesafeli-satis-sozlesmesi"
              className="hover:text-emerald-400 transition-colors"
            >
              {t("common.legalLinks.distanceSales")}
            </LocalizedLink>
            <LocalizedLink
              to="/iptal-ve-iade-kosullari"
              className="hover:text-emerald-400 transition-colors"
            >
              {t("common.legalLinks.refund")}
            </LocalizedLink>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
