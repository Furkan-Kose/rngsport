import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";

import MainLayout from "./layouts/MainLayout";
import LocaleRoot from "./layouts/LocaleRoot";
import { DEFAULT_LANG, LANGUAGES, type Lang } from "./i18n";

import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import GalleryPage from "./pages/GalleryPage";
import PackagesPage from "./pages/PackagesPage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ShopCheckoutPage from "./pages/ShopCheckoutPage";
import ShopOrderPage from "./pages/ShopOrderPage";
import LoginRequired from "./components/LoginRequired";
import CartPage from "./pages/CartPage";
import ReservationPage from "./pages/ReservationPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import OrderFailedPage from "./pages/OrderFailedPage";
import UserLoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import ProfilePage from "./pages/ProfilePage";
import MyGalleryPage from "./pages/MyGalleryPage";
import AwardCeremoniesPage from "./pages/AwardCeremoniesPage";
import AwardCeremonyDetailPage from "./pages/AwardCeremonyDetailPage";
import SharedGalleryPage from "./pages/SharedGalleryPage";
import CustomerGalleryPreviewPage from "./pages/CustomerGalleryPreviewPage";

import { SHOOTING_LIST_ROLES } from "./lib/roles";

import ProtectedRoute from "./components/ProtectedRoute";
import KvkkMetni from "./pages/legal/KvkkMetni";
import MesafeliSatis from "./pages/legal/MesafeliSatis";
import IadeKosullari from "./pages/legal/IadeKosullari";
import GizlilikPolitikasi from "./pages/legal/GizlilikPolitikasi";

// Admin paneli ayrı parçalara bölünür (lazy): müşteriler admin kodunu indirmez.
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const LoginPage = lazy(() => import("./pages/admin/LoginPage"));
const DashboardPage = lazy(() => import("./pages/admin/DashboardPage"));
const OrdersPage = lazy(() => import("./pages/admin/OrdersPage"));
const ReservationsPage = lazy(() => import("./pages/admin/ReservationsPage"));
const AdminPackagesPage = lazy(() => import("./pages/admin/PackagesPage"));
const ShootingListPage = lazy(() => import("./pages/admin/ShootingListPage"));
const UsersPage = lazy(() => import("./pages/admin/UsersPage"));
const UserDetailPage = lazy(() => import("./pages/admin/UserDetailPage"));
const UserGalleryPage = lazy(() => import("./pages/admin/UserGalleryPage"));
const TournamentsPage = lazy(() => import("./pages/admin/TournamentsPage"));
const AdminAwardCeremoniesPage = lazy(() => import("./pages/admin/AwardCeremoniesPage"));
const AwardCeremonyGalleryPage = lazy(() => import("./pages/admin/AwardCeremonyGalleryPage"));
const LoyaltyPage = lazy(() => import("./pages/admin/LoyaltyPage"));
const ShopProductsPage = lazy(() => import("./pages/admin/ShopProductsPage"));
const ShopOrdersPage = lazy(() => import("./pages/admin/ShopOrdersPage"));
const FeedbackPage = lazy(() => import("./pages/admin/FeedbackPage"));

// Admin parçası yüklenirken (lazy) gösterilen boş koyu ekran
const adminFallback = <div className="min-h-screen bg-gray-900" />;

// Müşteri sayfaları: her dil için aynı ağaç. Türkçe öneksiz (/sepet), diğerleri /en/sepet,
// /ru/sepet. Yollar göreli; korumalı sayfaların giriş yönlendirmesi de dilin önekini alır.
const publicRoutes = (lang: Lang) => {
  const prefix = lang === DEFAULT_LANG ? "" : `/${lang}`;
  const loginRedirect = (path: string) => `${prefix}/giris?redirect=${prefix}${path}`;
  return {
    path: prefix || "/",
    element: <LocaleRoot lang={lang} />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "hakkimizda", element: <AboutPage /> },
          { path: "galeri", element: <GalleryPage /> },
          { path: "odul-torenleri", element: <AwardCeremoniesPage /> },
          { path: "odul-torenleri/:slug", element: <AwardCeremonyDetailPage /> },
          { path: "paylasim/:token", element: <SharedGalleryPage /> },
          { path: "paketler", element: <PackagesPage /> },
          { path: "urunler", element: <ProductsPage /> },
          { path: "urunler/:slug", element: <ProductDetailPage /> },
          {
            path: "urunler/:slug/siparis",
            element: (
              <LoginRequired>
                <ShopCheckoutPage />
              </LoginRequired>
            ),
          },
          {
            path: "urun-siparisi/:id",
            element: (
              <LoginRequired>
                <ShopOrderPage />
              </LoginRequired>
            ),
          },
          { path: "sepet", element: <CartPage /> },
          { path: "rezervasyon", element: <ReservationPage /> },
          { path: "siparis-basarili", element: <OrderSuccessPage /> },
          { path: "siparis-basarisiz", element: <OrderFailedPage /> },
          { path: "giris", element: <UserLoginPage /> },
          { path: "kayit", element: <RegisterPage /> },
          { path: "sifremi-unuttum", element: <ForgotPasswordPage /> },
          { path: "sifre-sifirla", element: <ResetPasswordPage /> },
          { path: "eposta-dogrula", element: <VerifyEmailPage /> },
          {
            path: "profil",
            element: (
              <ProtectedRoute redirectTo={loginRedirect("/profil")}>
                <ProfilePage />
              </ProtectedRoute>
            ),
          },
          {
            path: "galerim",
            element: (
              <ProtectedRoute redirectTo={loginRedirect("/galerim")}>
                <MyGalleryPage />
              </ProtectedRoute>
            ),
          },
          {
            // Admin "müşteri gözüyle gör": müşterinin galerisi sitenin görünümüyle, salt okunur
            path: "galerim/onizleme/:userId",
            element: (
              <ProtectedRoute requiredRole="admin">
                <CustomerGalleryPreviewPage />
              </ProtectedRoute>
            ),
          },
          { path: "kvkk-aydinlatma-metni", element: <KvkkMetni /> },
          { path: "mesafeli-satis-sozlesmesi", element: <MesafeliSatis /> },
          { path: "iptal-ve-iade-kosullari", element: <IadeKosullari /> },
          { path: "gizlilik-ve-guvenlik-politikasi", element: <GizlilikPolitikasi /> },
        ],
      },
    ],
  };
};

export const router = createBrowserRouter([
  ...LANGUAGES.map(publicRoutes),
  // Admin Login (Unprotected)
  {
    path: "/admin/login",
    element: (
      <Suspense fallback={adminFallback}>
        <LoginPage />
      </Suspense>
    ),
  },
  // Admin Panel (Protected — sadece admin rolü)
  {
    element: (
      <ProtectedRoute requiredRole="admin">
        <Suspense fallback={adminFallback}>
          <AdminLayout />
        </Suspense>
      </ProtectedRoute>
    ),
    children: [
      {
        path: "/admin",
        element: <DashboardPage />,
      },
      {
        path: "/admin/orders",
        element: <OrdersPage />,
      },
      {
        path: "/admin/reservations",
        element: <ReservationsPage />,
      },
      {
        path: "/admin/packages",
        element: <AdminPackagesPage />,
      },
      {
        path: "/admin/users",
        element: <UsersPage />,
      },
      {
        path: "/admin/users/:id",
        element: <UserDetailPage />,
      },
      {
        path: "/admin/users/:id/galeri",
        element: <UserGalleryPage />,
      },
      {
        path: "/admin/tournaments",
        element: <TournamentsPage />,
      },
      {
        path: "/admin/award-ceremonies",
        element: <AdminAwardCeremoniesPage />,
      },
      {
        path: "/admin/award-ceremonies/:id",
        element: <AwardCeremonyGalleryPage />,
      },
      {
        path: "/admin/loyalty",
        element: <LoyaltyPage />,
      },
      {
        path: "/admin/shop/products",
        element: <ShopProductsPage />,
      },
      {
        path: "/admin/shop/orders",
        element: <ShopOrdersPage />,
      },
      {
        path: "/admin/feedback",
        element: <FeedbackPage />,
      },
    ],
  },
  // Çekim Listesi — admin + saha personeli (fotografci / videocu).
  // Ayrı bir grup: personel panelin geri kalanına giremez.
  {
    element: (
      <ProtectedRoute requiredRoles={SHOOTING_LIST_ROLES}>
        <Suspense fallback={adminFallback}>
          <AdminLayout />
        </Suspense>
      </ProtectedRoute>
    ),
    children: [
      {
        path: "/admin/shooting-list",
        element: <ShootingListPage />,
      },
    ],
  },
]);
