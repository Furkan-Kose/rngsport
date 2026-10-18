import { useEffect, useState } from "react";
import { Menu, X, ShoppingCart, Calendar, User, LogIn } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import LocalizedLink from "./LocalizedLink";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLocalizedPath } from "../lib/localePath";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { getTotalItems } = useCart();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { t } = useTranslation();
  const localize = useLocalizedPath();

  // Girişli kullanıcı: admin → panel, müşteri → profil
  const accountPath = isAdmin ? "/admin" : "/profil";
  const accountLabel = isAdmin
    ? t("common.nav.adminPanel")
    : user?.name?.split(" ")[0] || t("common.nav.account");

  const cartItemCount = getTotalItems();
  const showBackground = scrolled || isOpen;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks = [
    { name: t("common.nav.home"), href: localize("/#") },
    { name: t("common.nav.about"), href: localize("/hakkimizda") },
    { name: t("common.nav.gallery"), href: localize("/galeri") },
    { name: t("common.nav.awards"), href: localize("/odul-torenleri") },
    { name: t("common.nav.products"), href: localize("/urunler") },
    { name: t("common.nav.packages"), href: localize("/paketler") },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        showBackground
          ? "bg-black/50 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.6)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      {/* Animated bottom accent line */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-emerald-500/40 to-transparent transition-opacity duration-500 ${
          showBackground ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <LocalizedLink to="/" className="flex items-center gap-3 group">
            <img
              src="/logo-web.png"
              alt="RNG Sport"
              className="h-11 md:h-12 w-auto transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_20px_rgba(16,185,129,0.35)]"
            />
          </LocalizedLink>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="relative text-gray-300 hover:text-emerald-400 transition-colors duration-300 font-medium group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 group-hover:w-full h-px bg-emerald-500 transition-all duration-300" />
              </a>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher className="hidden md:block" />
            <LocalizedLink
              to="/rezervasyon"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-emerald-500/50 transition-all duration-300 group"
            >
              <Calendar className="w-4 h-4 text-zinc-300 group-hover:text-emerald-400 transition-colors" />
              <span className="text-sm font-medium text-zinc-300 group-hover:text-emerald-400 transition-colors">
                {t("common.nav.reserve")}
              </span>
            </LocalizedLink>

            <LocalizedLink
              to="/rezervasyon"
              className="sm:hidden p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-emerald-500/50 transition-all duration-300 group"
              title={t("common.nav.reserve")}
            >
              <Calendar className="w-5 h-5 text-zinc-300 group-hover:text-emerald-400 transition-colors" />
            </LocalizedLink>

            {isAuthenticated ? (
              <>
                <LocalizedLink
                  to={accountPath}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-emerald-500/50 transition-all duration-300 group"
                >
                  <User className="w-4 h-4 text-zinc-300 group-hover:text-emerald-400 transition-colors" />
                  <span className="text-sm font-medium text-zinc-300 group-hover:text-emerald-400 transition-colors max-w-24 truncate">
                    {accountLabel}
                  </span>
                </LocalizedLink>
                <LocalizedLink
                  to={accountPath}
                  className="sm:hidden p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-emerald-500/50 transition-all duration-300 group"
                  title={accountLabel}
                >
                  <User className="w-5 h-5 text-zinc-300 group-hover:text-emerald-400 transition-colors" />
                </LocalizedLink>
              </>
            ) : (
              <>
                <LocalizedLink
                  to="/giris"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-emerald-500/50 transition-all duration-300 group"
                >
                  <LogIn className="w-4 h-4 text-zinc-300 group-hover:text-emerald-400 transition-colors" />
                  <span className="text-sm font-medium text-zinc-300 group-hover:text-emerald-400 transition-colors">
                    {t("common.nav.login")}
                  </span>
                </LocalizedLink>
                <LocalizedLink
                  to="/giris"
                  className="sm:hidden p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-emerald-500/50 transition-all duration-300 group"
                  title={t("common.nav.login")}
                >
                  <LogIn className="w-5 h-5 text-zinc-300 group-hover:text-emerald-400 transition-colors" />
                </LocalizedLink>
              </>
            )}

            <LocalizedLink
              to="/sepet"
              aria-label={t("common.nav.cart")}
              className="relative p-2 sm:p-3 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-emerald-500/50 transition-all duration-300 group"
            >
              <ShoppingCart className="w-5 h-5 text-zinc-300 group-hover:text-emerald-400 transition-colors" />
              <AnimatePresence>
                {cartItemCount > 0 && (
                  <motion.span
                    key={cartItemCount}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-bold text-white bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                  >
                    {cartItemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </LocalizedLink>

            <button
              aria-label={t("common.nav.menu")}
              className="lg:hidden text-gray-300 hover:text-emerald-400 p-2 transition-colors duration-300"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
              className="lg:hidden overflow-hidden border-t border-white/10"
            >
              <div className="flex flex-col gap-1 py-4">
                <LanguageSwitcher variant="list" className="md:hidden mx-3 mb-2" />
                {navLinks.map((link, i) => (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="text-gray-300 hover:text-emerald-400 hover:bg-emerald-500/5 transition-colors duration-300 font-medium py-2.5 px-3 rounded-lg"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </motion.a>
                ))}
                {isAuthenticated && !isAdmin ? (
                  <>
                    <LocalizedLink
                      to="/profil"
                      className="text-gray-300 hover:text-emerald-400 hover:bg-emerald-500/5 transition-colors duration-300 font-medium py-2.5 px-3 rounded-lg"
                      onClick={() => setIsOpen(false)}
                    >
                      {t("common.nav.account")}
                    </LocalizedLink>
                    <LocalizedLink
                      to="/galerim"
                      className="text-gray-300 hover:text-emerald-400 hover:bg-emerald-500/5 transition-colors duration-300 font-medium py-2.5 px-3 rounded-lg"
                      onClick={() => setIsOpen(false)}
                    >
                      {t("common.nav.myPhotos")}
                    </LocalizedLink>
                  </>
                ) : !isAuthenticated ? (
                  <LocalizedLink
                    to="/giris"
                    className="text-gray-300 hover:text-emerald-400 hover:bg-emerald-500/5 transition-colors duration-300 font-medium py-2.5 px-3 rounded-lg"
                    onClick={() => setIsOpen(false)}
                  >
                    {t("common.nav.login")}
                  </LocalizedLink>
                ) : null}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;
