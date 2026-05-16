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

import LoginPage from "./pages/admin/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import OrdersPage from "./pages/admin/OrdersPage";
import ReservationsPage from "./pages/admin/ReservationsPage";
import PackagesPage from "./pages/admin/PackagesPage";
import ShootingListPage from "./pages/admin/ShootingListPage";

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
  // Admin Panel (Protected)
  {
    element: (
      <ProtectedRoute>
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
        path: "/admin/shooting-list",
        element: <ShootingListPage />,
      },
      {
        path: "/admin/packages",
        element: <PackagesPage />,
      },
    ],
  },
]);
