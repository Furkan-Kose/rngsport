import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { Menu, X, ShoppingCart, Calendar, User, LogIn } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import LocalizedLink from "./LocalizedLink";
import LanguageSwitcher from "./LanguageSwitcher";
import { stripLang } from "../lib/localePath";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { buttonClass, cx, iconButtonClass } from "../lib/siteUi";

// Aktif bağlantının rengi ayrı sınıf olarak eklenmez: iki yazı rengi sınıfından zinc kazanır
const mobileLinkClass = (active = false) =>
  cx(
    "flex items-center min-h-11 px-3 rounded-xl font-medium hover:bg-zinc-800/60 transition-colors",
    active ? "text-emerald-400" : "text-zinc-200 hover:text-emerald-400",
  );

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const { getTotalItems } = useCart();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const currentPath = stripLang(location.pathname);
  // Mobil menü, açıldığı sayfaya bağlıdır: başka sayfaya geçilince kendiliğinden kapanır
  const [openAt, setOpenAt] = useState<string | null>(null);
  const isOpen = openAt === location.pathname;
  const setIsOpen = (open: boolean) => setOpenAt(open ? location.pathname : null);

  // Girişli kullanıcı: admin → panel, müşteri → profil
  const accountPath = isAdmin ? "/admin" : "/profil";
  const accountLabel = isAdmin
    ? t("common.nav.adminPanel")
    : user?.name?.split(" ")[0] || t("common.nav.account");
  const isCustomer = isAuthenticated && !isAdmin;

  const cartItemCount = getTotalItems();
  const showBackground = scrolled || isOpen;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Esc ile mobil menü kapanır
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenAt(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  // Logo ana sayfaya gider; ayrıca "Ana Sayfa" bağlantısı yok
  const navLinks = [
    { name: t("common.nav.packages"), to: "/paketler" },
    { name: t("common.nav.gallery"), to: "/galeri" },
    { name: t("common.nav.awards"), to: "/odul-torenleri" },
    { name: t("common.nav.products"), to: "/urunler" },
    { name: t("common.nav.about"), to: "/hakkimizda" },
    ...(isCustomer ? [{ name: t("common.nav.myPhotos"), to: "/galerim" }] : []),
  ];

  const isActive = (to: string) => currentPath === to || currentPath.startsWith(`${to}/`);

  return (
    <header
      className={cx(
        "fixed top-0 left-0 right-0 z-50 border-b transition-colors duration-300",
        showBackground ? "bg-black/70 backdrop-blur-xl border-white/10" : "bg-transparent border-transparent",
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20 gap-4">
          <LocalizedLink to="/" className="flex items-center shrink-0" aria-label={t("common.nav.home")}>
            <img src="/logo-web.png" alt="RNG Sport" className="h-11 md:h-12 w-auto" />
          </LocalizedLink>

          {/* Masaüstü menü */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((link) => (
              <LocalizedLink
                key={link.to}
                to={link.to}
                aria-current={isActive(link.to) ? "page" : undefined}
                className={cx(
                  "font-medium transition-colors whitespace-nowrap",
                  isActive(link.to) ? "text-emerald-400" : "text-zinc-300 hover:text-white",
                )}
              >
                {link.name}
              </LocalizedLink>
            ))}
          </nav>

          {/* Telefonda yalnızca sepet + menü; giriş ve rezervasyon menünün içinde.
              Gizleme max-sm:hidden ile: buttonClass zaten inline-flex verdiği için düz `hidden` ondan önce
              üretilip kaybeder ve butonlar sepeti/menüyü ekranın dışına iter. */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher className="hidden md:block" />

            <LocalizedLink
              to={isAuthenticated ? accountPath : "/giris"}
              className={buttonClass("secondary", "sm", "max-sm:hidden")}
            >
              {isAuthenticated ? <User className="w-4 h-4" aria-hidden /> : <LogIn className="w-4 h-4" aria-hidden />}
              <span className="max-w-24 truncate">{isAuthenticated ? accountLabel : t("common.nav.login")}</span>
            </LocalizedLink>

            <LocalizedLink to="/rezervasyon" className={buttonClass("primary", "sm", "max-sm:hidden")}>
              <Calendar className="w-4 h-4" aria-hidden />
              {t("common.nav.reserve")}
            </LocalizedLink>

            <LocalizedLink
              to="/sepet"
              aria-label={
                cartItemCount > 0 ? `${t("common.nav.cart")} (${cartItemCount})` : t("common.nav.cart")
              }
              className={iconButtonClass("secondary", "relative")}
            >
              <ShoppingCart className="w-5 h-5" aria-hidden />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 flex items-center justify-center text-xs font-bold text-zinc-950 bg-emerald-400 rounded-full">
                  {cartItemCount}
                </span>
              )}
            </LocalizedLink>

            <button
              type="button"
              aria-label={t("common.nav.menu")}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              className={iconButtonClass("ghost", "lg:hidden")}
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-6 h-6" aria-hidden /> : <Menu className="w-6 h-6" aria-hidden />}
            </button>
          </div>
        </div>

        {/* Mobil menü */}
        <AnimatePresence>
          {isOpen && (
            <motion.nav
              id="mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden border-t border-white/10"
            >
              <div className="flex flex-col gap-1 py-4 max-h-[calc(100dvh-5rem)] overflow-y-auto">
                <LocalizedLink to="/rezervasyon" className={buttonClass("primary", "md", "mb-2")}>
                  <Calendar className="w-4 h-4" aria-hidden />
                  {t("common.nav.reserve")}
                </LocalizedLink>

                {navLinks.map((link) => (
                  <LocalizedLink
                    key={link.to}
                    to={link.to}
                    aria-current={isActive(link.to) ? "page" : undefined}
                    className={mobileLinkClass(isActive(link.to))}
                  >
                    {link.name}
                  </LocalizedLink>
                ))}

                <LocalizedLink to="/sepet" className={mobileLinkClass()}>
                  {t("common.nav.cart")}
                  {cartItemCount > 0 && <span className="ml-2 text-emerald-400">({cartItemCount})</span>}
                </LocalizedLink>

                <LocalizedLink to={isAuthenticated ? accountPath : "/giris"} className={mobileLinkClass()}>
                  {isAuthenticated
                    ? isAdmin
                      ? t("common.nav.adminPanel")
                      : t("common.nav.account")
                    : t("common.nav.login")}
                </LocalizedLink>

                <LanguageSwitcher variant="list" className="md:hidden mx-3 mt-3" />
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;
