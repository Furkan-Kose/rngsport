import { Instagram, Facebook } from "lucide-react";

const Footer = () => {

  const navLinks = [
    { name: "Ana Sayfa", href: "/#home" },
    { name: "Paketler", href: "/#packages" },
    { name: "Galeri", href: "/#gallery" },
    { name: "Süreç", href: "/#process" },
    { name: "SSS", href: "/#faq" },
  ];

  return (
    <footer id="contact" className="py-16 border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo & About */}
          <div className="md:col-span-2">
            <a href="#home" className="flex items-center gap-3 mb-6">
              <img src="/logo.webp" alt="Ritmika Cimnastik" className="w-14 h-14" />
              <div>
                <span className="text-xl font-bold text-gray-200">International</span>
                <span className="text-xl font-light text-fuchsia-500 ml-1 md:ml-2">Ritmika Cup</span>
              </div>
            </a>
            <p className="text-gray-400 max-w-md mb-6">
              "Ritmika Spor Kulübü tarafından organize edilmektedir. Geleceğin yıldızlarına, dünya standartlarında bir sahne sunmaktan gurur duyuyoruz."
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-xl border border-white/10 shadow-lg flex items-center justify-center text-gray-400 hover:text-fuchsia-500 hover:border-fuchsia-500 transition-all"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-xl border border-white/10 shadow-lg flex items-center justify-center text-gray-400 hover:text-fuchsia-500 hover:border-fuchsia-500 transition-all"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-xl border border-white/10 shadow-lg flex items-center justify-center text-gray-400 hover:text-fuchsia-500 hover:border-fuchsia-500 transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-gray-200 mb-6">Hızlı Bağlantılar</h4>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-gray-400 hover:text-fuchsia-500 transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-gray-200 mb-6">İletişim</h4>
            <ul className="space-y-3 text-gray-400">
              <li>+90 (539) 844 45 21</li>
              <li>İstanbul, Türkiye</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <a
            href="https://rangemedia.com.tr"
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-gray-400 hover:underline transition-colors">
            © 2026 Range Media Tüm hakları saklıdır.
          </a>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-fuchsia-500 transition-colors">Gizlilik Politikası</a>
            <a href="#" className="hover:text-fuchsia-500 transition-colors">Kullanım Şartları</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;