import { useState } from "react";
import { Menu, X, ShoppingCart, Calendar } from "lucide-react";
import { Link } from "react-router";
import { useCart } from "../context/CartContext";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { getTotalItems } = useCart();

  const cartItemCount = getTotalItems();

  const navLinks = [
    { name: "Ana Sayfa", href: "/#" },
    { name: "Hakkımızda", href: "/hakkimizda" },
    { name: "Galeri", href: "/galeri" },
    { name: "Paketler", href: "/#paketler" },
    { name: "Süreç", href: "/#surec" },
    { name: "SSS", href: "/#sss" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-xl border border-white/10 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/logo.PNG"
              alt="Ritmika Cimnastik"
              className="w-30 h-30 transition-transform duration-300 group-hover:scale-110"
            />
            {/* <div className="hidden md:block">
              <span className="text-lg font-bold text-white">
                International
              </span>
              <span className="text-lg font-light text-fuchsia-500 ml-2">
                Ritmika Cup
              </span>
            </div> */}
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-gray-400 hover:text-emerald-500 transition-colors duration-300 font-medium"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Reservation Button */}
            <Link
              to="/rezervasyon"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-emerald-500/50 transition-all duration-300 group"
            >
              <Calendar className="w-4 h-4 text-zinc-300 group-hover:text-emerald-400 transition-colors" />
              <span className="text-sm font-medium text-zinc-300 group-hover:text-emerald-400 transition-colors">
                Rezervasyon Yap
              </span>
            </Link>

            {/* Reservation Button Mobile */}
            <Link
              to="/rezervasyon"
              className="sm:hidden p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-violet-500/50 transition-all duration-300 group"
              title="Rezervasyon Yap"
            >
              <Calendar className="w-5 h-5 text-zinc-300 group-hover:text-emerald-400 transition-colors" />
            </Link>

            {/* Cart Button */}
            <Link
              to="/sepet"
              className="relative p-2 sm:p-3 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-emerald-500/50 transition-all duration-300 group"
            >
              <ShoppingCart className="w-5 h-5 text-zinc-300 group-hover:text-emerald-400 transition-colors" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-bold text-white bg-linear-to-r from-emerald-500 to-violet-500 rounded-full">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden text-gray-400 hover:text-emerald-500 p-2 transition-colors duration-300"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <nav className="lg:hidden py-4 border-t border-border/50">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-gray-400 hover:text-emerald-500 transition-colors duration-300 font-medium py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </a>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
