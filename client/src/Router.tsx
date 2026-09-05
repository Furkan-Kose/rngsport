import { createBrowserRouter } from "react-router";

import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";

import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import GalleryPage from "./pages/GalleryPage";
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

import LoginPage from "./pages/admin/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import OrdersPage from "./pages/admin/OrdersPage";
import ReservationsPage from "./pages/admin/ReservationsPage";
import PackagesPage from "./pages/admin/PackagesPage";
import ShootingListPage from "./pages/admin/ShootingListPage";
import UsersPage from "./pages/admin/UsersPage";
import UserGalleryPage from "./pages/admin/UserGalleryPage";
import TournamentsPage from "./pages/admin/TournamentsPage";
import { SHOOTING_LIST_ROLES } from "./lib/roles";

import ProtectedRoute from "./components/ProtectedRoute";
import KvkkMetni from "./pages/legal/KvkkMetni";
import MesafeliSatis from "./pages/legal/MesafeliSatis";
import IadeKosullari from "./pages/legal/IadeKosullari";
import GizlilikPolitikasi from "./pages/legal/GizlilikPolitikasi";

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/hakkimizda",
        element: <AboutPage />,
      },
      {
        path: "/galeri",
        element: <GalleryPage />,
      },
      {
        path: "/sepet",
        element: <CartPage />,
      },
      {
        path: "/rezervasyon",
        element: <ReservationPage />,
      },
      {
        path: "/siparis-basarili",
        element: <OrderSuccessPage />,
      },
      {
        path: "/siparis-basarisiz",
        element: <OrderFailedPage />,
      },
      {
        path: "/giris",
        element: <UserLoginPage />,
      },
      {
        path: "/kayit",
        element: <RegisterPage />,
      },
      {
        path: "/sifremi-unuttum",
        element: <ForgotPasswordPage />,
      },
      {
        path: "/sifre-sifirla",
        element: <ResetPasswordPage />,
      },
      {
        path: "/eposta-dogrula",
        element: <VerifyEmailPage />,
      },
      {
        path: "/profil",
        element: (
          <ProtectedRoute redirectTo="/giris?redirect=/profil">
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/galerim",
        element: (
          <ProtectedRoute redirectTo="/giris?redirect=/galerim">
            <MyGalleryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/kvkk-aydinlatma-metni",
        element: <KvkkMetni />,
      },
      {
        path: "/mesafeli-satis-sozlesmesi",
        element: <MesafeliSatis />,
      },
      {
        path: "/iptal-ve-iade-kosullari",
        element: <IadeKosullari />,
      },
      {
        path: "/gizlilik-ve-guvenlik-politikasi",
        element: <GizlilikPolitikasi />,
      },
    ],
  },
  // Admin Login (Unprotected)
  {
    path: "/admin/login",
    element: <LoginPage />,
  },
  // Admin Panel (Protected — sadece admin rolü)
  {
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminLayout />
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
        element: <PackagesPage />,
      },
      {
        path: "/admin/users",
        element: <UsersPage />,
      },
      {
        path: "/admin/users/:id/galeri",
        element: <UserGalleryPage />,
      },
      {
        path: "/admin/tournaments",
        element: <TournamentsPage />,
      },
    ],
  },
  // Çekim Listesi — admin + saha personeli (fotografci / videocu).
  // Ayrı bir grup: personel panelin geri kalanına giremez.
  {
    element: (
      <ProtectedRoute requiredRoles={SHOOTING_LIST_ROLES}>
        <AdminLayout />
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
