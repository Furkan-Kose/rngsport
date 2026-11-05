import { Suspense, useEffect, useState } from "react";
import { Outlet, NavLink, Link, useNavigate, useLocation } from "react-router";
import { PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ROLES, SHOOTING_LIST_ROLES, roleLabel } from "../lib/roles";
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

const NAV_GROUPS: { title: string | null; paths: string[] }[] = [
  { title: null, paths: ['/admin'] },
  { title: 'Satış', paths: ['/admin/orders', '/admin/reservations', '/admin/shop/orders'] },
  { title: 'Çekim', paths: ['/admin/shooting-list'] },
  { title: 'Katalog', paths: ['/admin/packages', '/admin/shop/products', '/admin/loyalty'] },
  { title: 'İçerik', paths: ['/admin/tournaments', '/admin/award-ceremonies', '/admin/feedback'] },
  { title: 'Yönetim', paths: ['/admin/users'] },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Masaüstünde menüyü yalnızca ikona daraltma (tarayıcıda hatırlanır; mobil çekmeceyi etkilemez)
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [searchOpen, setSearchOpen] = useState(false);
  const isAdmin = user?.role === ROLES.ADMIN;
  const badges = useAdminBadges(isAdmin);

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
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  // roles: menüyü hangi rollerin göreceği. Personel sadece Çekim Listesi'ni görür.
  const allNavItems = [
    {
      name: 'Dashboard',
      path: '/admin',
      roles: [ROLES.ADMIN],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: 'Paket Siparişleri',
      path: '/admin/orders',
      roles: [ROLES.ADMIN],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      name: 'Rezervasyonlar',
      path: '/admin/reservations',
      roles: [ROLES.ADMIN],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: 'Çekim Listesi',
      path: '/admin/shooting-list',
      roles: SHOOTING_LIST_ROLES,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      name: 'Paketler',
      path: '/admin/packages',
      roles: [ROLES.ADMIN],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      name: 'Ürünler',
      path: '/admin/shop/products',
      roles: [ROLES.ADMIN],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      name: 'Ürün Siparişleri',
      path: '/admin/shop/orders',
      roles: [ROLES.ADMIN],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      ),
    },
    {
      name: 'Görüşler',
      path: '/admin/feedback',
      roles: [ROLES.ADMIN],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 20l1.3-3.9A7.5 7.5 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      name: 'Turnuvalar',
      path: '/admin/tournaments',
      roles: [ROLES.ADMIN],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21h8m-4-4v4m-5.5-15h11M6.5 6v4a5.5 5.5 0 1011 0V6m-13 1h2v3a3 3 0 01-3-3 1 1 0 011-1zm15 0h-2v3a3 3 0 003-3 1 1 0 00-1-1z" />
        </svg>
      ),
    },
    {
      name: 'Ödül Törenleri',
      path: '/admin/award-ceremonies',
      roles: [ROLES.ADMIN],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="6" strokeWidth={2} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
        </svg>
      ),
    },
    {
      name: 'Sadakat',
      path: '/admin/loyalty',
      roles: [ROLES.ADMIN],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.48 3.5a.56.56 0 011.04 0l2.13 5.11a.56.56 0 00.47.35l5.52.44c.5.04.7.66.32.99l-4.2 3.6a.56.56 0 00-.18.56l1.28 5.39a.56.56 0 01-.84.61l-4.73-2.89a.56.56 0 00-.58 0l-4.73 2.89a.56.56 0 01-.84-.61l1.28-5.39a.56.56 0 00-.18-.56l-4.2-3.6a.56.56 0 01.32-.99l5.52-.44a.56.56 0 00.47-.35l2.13-5.11z" />
        </svg>
      ),
    },
    {
      name: 'Kullanıcılar',
      path: '/admin/users',
      roles: [ROLES.ADMIN],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6-4a3 3 0 11-3-3" />
        </svg>
      ),
    },
  ];

  const navItems = allNavItems.filter((item) =>
    item.roles.includes(user?.role ?? ''),
  );

  // Menü grupları (başlıksız ilk grup: Dashboard). Kullanıcının göremediği
  // öğeler düşer, boş kalan grup hiç çizilmez.
  const navGroups = NAV_GROUPS.map((group) => ({
    title: group.title,
    items: group.paths
      .map((path) => navItems.find((item) => item.path === path))
      .filter((item): item is (typeof navItems)[number] => !!item),
  })).filter((group) => group.items.length > 0);
  // Personel tek öğe görür; tek grup varsa başlığa gerek yok
  const showGroupTitles = navGroups.length > 1;
  // Daraltılmışken masaüstünde gizlenecek metinler
  const hideCollapsed = collapsed ? "lg:hidden" : "";

  return (
    <div className="min-h-screen bg-gray-900 lg:flex">
      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-30 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <span className="text-white font-semibold">rngsport</span>
          </div>
          <div className="flex items-center gap-1">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors"
              aria-label="Ara"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="relative p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors"
            aria-label="Menüyü aç"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            {/* Menü kapalıyken yeni kayıt varsa nokta */}
            {Object.values(badges).some((n) => n > 0) && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>
          </div>
        </div>
      </header>

      {/* Backdrop (mobile only) */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 w-64 ${collapsed ? "lg:w-16" : ""} bg-gray-800/95 lg:bg-gray-800/50 backdrop-blur-sm border-r border-gray-700 flex flex-col transform transition-transform duration-200 ease-in-out lg:transform-none lg:h-screen ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className={`py-4 border-b border-gray-700 flex items-center justify-between ${collapsed ? "px-5 lg:px-0 lg:justify-center" : "px-5"}`}>
          <div className={`flex items-center gap-3 ${hideCollapsed}`}>
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-bold">rngsport</h1>
              <p className="text-gray-400 text-xs">Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className={`p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors ${hideCollapsed}`}
              title="Ara (Ctrl+K)"
              aria-label="Ara"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden lg:inline-flex p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
            title={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
            aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
          >
            {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
            aria-label="Menüyü kapat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`admin-scroll flex-1 min-h-0 py-3 overflow-y-auto ${collapsed ? "px-3 lg:px-2" : "px-3"}`}>
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
            <div key={group.title ?? 'main'} className={index > 0 ? 'mt-3' : ''}>
              {showGroupTitles && group.title && (
                <>
                  <p className={`px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500 ${hideCollapsed}`}>
                    {group.title}
                  </p>
                  {collapsed && <div className="hidden lg:block mx-2 mb-2 border-t border-gray-700" />}
                </>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const section = BADGE_SECTION_BY_PATH[item.path];
                  const count = section && isAdmin ? badges[section] : 0;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.path === '/admin'}
                        title={collapsed ? item.name : undefined}
                        className={({ isActive }) =>
                          `relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            collapsed ? 'lg:justify-center lg:px-0' : ''
                          } ${
                            isActive
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                          }`
                        }
                      >
                        {item.icon}
                        <span className={`flex-1 ${hideCollapsed}`}>{item.name}</span>
                        {count > 0 && (
                          <span
                            className={`min-w-5 h-5 px-1.5 rounded-full bg-amber-500 text-white text-[11px] font-bold leading-5 text-center ${
                              collapsed ? 'lg:absolute lg:top-0 lg:right-0 lg:min-w-4 lg:h-4 lg:px-1 lg:leading-4 lg:text-[10px]' : ''
                            }`}
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

        {/* User Section: ad + Siteye Dön + Çıkış */}
        <div className="px-3 py-3 border-t border-gray-700">
          <div className={`flex items-center gap-2 px-2 ${collapsed ? "lg:flex-col lg:px-0" : ""}`}>
            <div className={`w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center shrink-0 ${hideCollapsed}`}>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className={`flex-1 min-w-0 ${hideCollapsed}`}>
              <p className="text-white text-sm font-medium truncate">{user?.name || user?.username}</p>
              <p className="text-gray-400 text-xs">{roleLabel(user?.role)}</p>
            </div>
            <Link
              to="/"
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
              title="Siteye Dön"
              aria-label="Siteye Dön"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-700/50 transition-colors"
              title="Çıkış Yap"
              aria-label="Çıkış Yap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Sayfa parçası (lazy) yüklenirken menü yerinde kalsın */}
          <Suspense
            fallback={<SkeletonPage />}
          >
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
