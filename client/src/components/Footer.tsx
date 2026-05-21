import { Instagram, Facebook, ShieldCheck } from "lucide-react";
import { Link } from "react-router";

const Footer = () => {
  const navLinks = [
    { name: "Ana Sayfa", href: "/#" },
    { name: "Hakkımızda", href: "/hakkimizda" },
    { name: "Galeri", href: "/galeri" },
    { name: "Paketler", href: "/#paketler" },
    { name: "Süreç", href: "/#surec" },
    { name: "SSS", href: "/#sss" },
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
                src="/logo.PNG"
                alt="Ritmika Cimnastik"
                className="w-30 h-30 transition-transform duration-300 group-hover:scale-105"
              />
            </a>
            <p className="text-gray-400 max-w-md mb-6 leading-relaxed">
              RNG Sport olarak ritmik cimnastik başta olmak üzere spor
              organizasyonlarında fotoğraf ve video prodüksiyon hizmeti
              sunuyoruz.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-zinc-900/70 backdrop-blur border border-white/10 shadow-lg flex items-center justify-center text-gray-400 hover:text-emerald-400 hover:border-emerald-500/60 hover:bg-emerald-500/10 hover:shadow-[0_0_18px_rgba(16,185,129,0.35)] hover:scale-110 transition-all duration-300"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-zinc-900/70 backdrop-blur border border-white/10 shadow-lg flex items-center justify-center text-gray-400 hover:text-emerald-400 hover:border-emerald-500/60 hover:bg-emerald-500/10 hover:shadow-[0_0_18px_rgba(16,185,129,0.35)] hover:scale-110 transition-all duration-300"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-zinc-900/70 backdrop-blur border border-white/10 shadow-lg flex items-center justify-center text-gray-400 hover:text-emerald-400 hover:border-emerald-500/60 hover:bg-emerald-500/10 hover:shadow-[0_0_18px_rgba(16,185,129,0.35)] hover:scale-110 transition-all duration-300"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-gray-100 mb-6 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-emerald-500" />
              Hızlı Bağlantılar
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
              İletişim
            </h4>
            <ul className="space-y-3 text-gray-400">
              <li className="hover:text-emerald-400 transition-colors">
                +90 (539) 844 45 21
              </li>
              <li>İstanbul, Türkiye</li>
            </ul>
          </div>
        </div>

        {/* Secure payment + logos */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-300">
              Güvenli Ödeme
            </span>
          </div>
          <img
            src="/footerLogo.png"
            alt="Ödeme Yöntemleri - iyzico, Visa, Mastercard"
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
            © 2026 Range Media Tüm hakları saklıdır.
          </a>
          <div className="flex flex-col md:flex-row gap-2 md:gap-6 text-sm text-gray-400">
            <Link
              to="/gizlilik-ve-guvenlik-politikasi"
              className="hover:text-emerald-400 transition-colors"
            >
              Gizlilik Politikası
            </Link>
            <Link
              to="/kvkk-aydinlatma-metni"
              className="hover:text-emerald-400 transition-colors"
            >
              KVKK Aydınlatma Metni
            </Link>
            <Link
              to="/mesafeli-satis-sozlesmesi"
              className="hover:text-emerald-400 transition-colors"
            >
              Mesafeli Satış Sözleşmesi
            </Link>
            <Link
              to="/iptal-ve-iade-kosullari"
              className="hover:text-emerald-400 transition-colors"
            >
              İptal ve İade Koşulları
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
