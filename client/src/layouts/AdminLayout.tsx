import { Suspense, useEffect, useState, type ComponentType } from "react";
import { Outlet, NavLink, Link, useNavigate, useLocation } from "react-router";
import {
  Award,
  CalendarDays,
  Camera,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Star,
  Trophy,
  Truck,
  User,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ROLES, SHOOTING_LIST_ROLES, roleLabel } from "../lib/roles";
import { useApplyAdminTheme } from "../lib/adminTheme";
import { cx } from "../lib/adminUi";
import UploadTray from "../components/admin/UploadTray";
import CommandSearch from "../components/admin/CommandSearch";
import { SkeletonPage } from "../components/admin/ui";
import { BADGE_SECTION_BY_PATH, useAdminBadges } from "../hooks/useAdminBadges";

const COLLAPSE_KEY = "admin-sidebar-collapsed";
const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
};

const badgeText = (n: number) => (n > 99 ? "99+" : String(n));

interface NavItem {
  name: string;
  path: string;
  /** Sayfa başlığındaki (PageHeader) ikonla aynı olmalı */
  icon: ComponentType<{ className?: string }>;
  /** Menüyü hangi rollerin göreceği. Personel yalnızca Çekim Listesi ve Ayarlar'ı görür. */
  roles: string[];
}

const ADMIN_ONLY = [ROLES.ADMIN];

/**
 * Menünün TEK tanımı: gruplar ve sırası burada. Kullanıcının göremediği öğeler düşer,
 * boş kalan grup çizilmez. Yeni sayfa eklerken yalnızca buraya (ve Router'a) eklenir.
 */
const NAV_GROUPS: { title: string | null; items: NavItem[] }[] = [
  { title: null, items: [{ name: "Ana Sayfa", path: "/admin", icon: LayoutDashboard, roles: ADMIN_ONLY }] },
  {
    title: "Satış",
    items: [
      { name: "Rezervasyonlar", path: "/admin/reservations", icon: CalendarDays, roles: ADMIN_ONLY },
      { name: "Paket Siparişleri", path: "/admin/orders", icon: ShoppingCart, roles: ADMIN_ONLY },
      { name: "Ürün Siparişleri", path: "/admin/shop/orders", icon: Truck, roles: ADMIN_ONLY },
    ],
  },
  {
    title: "Çekim",
    items: [
      { name: "Çekim Listesi", path: "/admin/shooting-list", icon: Camera, roles: SHOOTING_LIST_ROLES },
      { name: "Yarışmalar", path: "/admin/tournaments", icon: Trophy, roles: ADMIN_ONLY },
    ],
  },
  {
    title: "Müşteri",
    items: [
      { name: "Kullanıcılar", path: "/admin/users", icon: Users, roles: ADMIN_ONLY },
      { name: "Görüşler", path: "/admin/feedback", icon: MessageSquare, roles: ADMIN_ONLY },
    ],
  },
  {
    title: "Katalog",
    items: [
      { name: "Paketler", path: "/admin/packages", icon: Package, roles: ADMIN_ONLY },
      { name: "Ürünler", path: "/admin/shop/products", icon: ShoppingBag, roles: ADMIN_ONLY },
      { name: "Sadakat", path: "/admin/loyalty", icon: Star, roles: ADMIN_ONLY },
      { name: "Ödül Törenleri", path: "/admin/award-ceremonies", icon: Award, roles: ADMIN_ONLY },
    ],
  },
  {
    title: "Sistem",
    items: [{ name: "Ayarlar", path: "/admin/settings", icon: Settings, roles: SHOOTING_LIST_ROLES }],
  },
];

const iconButton = "inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors";

const Brand = ({ compact = false }: { compact?: boolean }) => (
  <div className="flex items-center gap-3">
    <div className={cx("bg-amber-500 rounded-lg flex items-center justify-center", compact ? "w-8 h-8" : "w-9 h-9")}>
      <Camera className={cx("text-gray-950", compact ? "w-4 h-4" : "w-5 h-5")} />
    </div>
    <div>
      <p className="text-white font-bold leading-tight">rngsport</p>
      {!compact && <p className="text-gray-400 text-xs">Yönetim Paneli</p>}
    </div>
  </div>
);

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Mobil çekmece, açıldığı sayfaya bağlıdır: başka sayfaya geçilince kendiliğinden kapanır
  const [openAt, setOpenAt] = useState<string | null>(null);
  const sidebarOpen = openAt === location.pathname;
  const setSidebarOpen = (open: boolean) => setOpenAt(open ? location.pathname : null);
  // Masaüstünde menüyü yalnızca ikona daraltma (tarayıcıda hatırlanır; mobil çekmeceyi etkilemez)
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [searchOpen, setSearchOpen] = useState(false);
  const isAdmin = user?.role === ROLES.ADMIN;
  const badges = useAdminBadges(isAdmin);
  // Seçili temayı <html>'e uygular (panelden çıkınca kaldırılır)
  useApplyAdminTheme();

  const toggleCollapsed = () =>
    setCollapsed((prev) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, prev ? "0" : "1");
      } catch {
        /* yoksay */
      }
      return !prev;
    });

  // Ctrl/⌘+K → hızlı arama (yalnızca admin)
  useEffect(() => {
    if (!isAdmin) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isAdmin]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  const navGroups = NAV_GROUPS.map((group) => ({
    title: group.title,
    items: group.items.filter((item) => item.roles.includes(user?.role ?? "")),
  })).filter((group) => group.items.length > 0);
  // Daraltılmışken masaüstünde gizlenecek metinler
  const hideCollapsed = collapsed ? "lg:hidden" : "";

  return (
    <div className="min-h-screen bg-gray-900 lg:flex">
      {/* Mobil üst çubuk */}
      <header className="lg:hidden sticky top-0 z-30 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between px-4 py-2.5">
          <Brand compact />
          <div className="flex items-center gap-1">
            {isAdmin && (
              <button type="button" onClick={() => setSearchOpen(true)} className={iconButton} aria-label="Ara">
                <Search className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className={cx(iconButton, "relative")}
              aria-label="Menüyü aç"
              aria-expanded={sidebarOpen}
            >
              <Menu className="w-6 h-6" />
              {/* Menü kapalıyken yeni kayıt varsa nokta */}
              {Object.values(badges).some((n) => n > 0) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Karartma (yalnızca mobil) */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Yan menü */}
      <aside
        className={cx(
          "fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 w-64 bg-gray-800 lg:bg-gray-800/50 border-r border-gray-700",
          "flex flex-col transform transition-transform duration-200 ease-in-out lg:transform-none lg:h-screen",
          collapsed && "lg:w-16",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div
          className={cx(
            "py-3 border-b border-gray-700 flex items-center justify-between",
            collapsed ? "px-4 lg:px-0 lg:justify-center" : "px-4",
          )}
        >
          <div className={hideCollapsed}>
            <Brand />
          </div>
          <div className="flex items-center gap-0.5">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className={cx(iconButton, hideCollapsed)}
                title="Ara (Ctrl+K)"
                aria-label="Ara"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={toggleCollapsed}
              className={cx(iconButton, "hidden lg:inline-flex")}
              title={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
              aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
            >
              {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className={cx(iconButton, "lg:hidden")}
              aria-label="Menüyü kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Menü ekrana sığacak şekilde sıkı; kısa ekranda grup başlıkları ayırıcı çizgiye döner.
            Yine de taşarsa kaydırılır ama çubuk görünmez. */}
        <nav className={cx("no-scrollbar flex-1 min-h-0 py-3 overflow-y-auto", collapsed ? "px-3 lg:px-2" : "px-3")}>
          {/* Daraltılmış menüde arama ikonu (genişken logo satırında) */}
          {isAdmin && collapsed && (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden lg:flex w-full justify-center py-2 mb-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50"
              title="Ara (Ctrl+K)"
              aria-label="Ara"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
          {navGroups.map((group, index) => (
            <div key={group.title ?? "main"} className={index > 0 ? "mt-3 [@media(max-height:820px)]:mt-2" : ""}>
              {group.title && (
                <>
                  <p
                    className={cx(
                      "px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 [@media(max-height:820px)]:hidden",
                      hideCollapsed,
                    )}
                  >
                    {group.title}
                  </p>
                  <div
                    className={cx(
                      "hidden mx-2 mb-1.5 border-t border-gray-700",
                      collapsed ? "lg:block" : "[@media(max-height:820px)]:block",
                    )}
                  />
                </>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const section = BADGE_SECTION_BY_PATH[item.path];
                  const count = section && isAdmin ? badges[section] : 0;
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.path === "/admin"}
                        title={collapsed ? item.name : undefined}
                        className={({ isActive }) =>
                          cx(
                            "relative flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                            collapsed && "lg:justify-center lg:px-0",
                            isActive ? "bg-amber-500/15 text-amber-400" : "text-gray-300 hover:text-white hover:bg-gray-700/50",
                          )
                        }
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        <span className={cx("flex-1", hideCollapsed)}>{item.name}</span>
                        {count > 0 && (
                          <span
                            className={cx(
                              "min-w-5 h-5 px-1.5 rounded-full bg-amber-500 text-gray-950 text-xs font-bold leading-5 text-center",
                              collapsed && "lg:absolute lg:-top-0.5 lg:-right-0.5",
                            )}
                            title={`Son bakışınızdan beri ${count} yeni`}
                          >
                            {badgeText(count)}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Kullanıcı: ad + siteye dön + çıkış */}
        <div className="px-3 py-2 border-t border-gray-700">
          <div className={cx("flex items-center gap-1 px-1", collapsed && "lg:flex-col lg:px-0")}>
            <Link
              to="/admin/settings"
              className={cx("flex items-center gap-2.5 flex-1 min-w-0 rounded-lg p-1 hover:bg-gray-700/50 transition-colors", hideCollapsed)}
              title="Ayarlar"
            >
              <span className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-gray-300" />
              </span>
              <span className="min-w-0">
                <span className="block text-white text-sm font-medium truncate">{user?.name || user?.username}</span>
                <span className="block text-gray-400 text-xs">{roleLabel(user?.role)}</span>
              </span>
            </Link>
            <Link to="/" className={iconButton} title="Siteye dön" aria-label="Siteye dön">
              <ExternalLink className="w-5 h-5" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className={cx(iconButton, "hover:text-red-400")}
              title="Çıkış yap"
              aria-label="Çıkış yap"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Sayfa içeriği */}
      <main className="flex-1 min-w-0 overflow-x-clip">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Sayfa parçası (lazy) yüklenirken menü yerinde kalsın */}
          <Suspense fallback={<SkeletonPage />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <UploadTray />
      {isAdmin && <CommandSearch open={searchOpen} onClose={() => setSearchOpen(false)} />}
    </div>
  );
};

export default AdminLayout;
