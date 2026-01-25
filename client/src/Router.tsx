import { createBrowserRouter } from "react-router";

import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";

import HomePage from "./pages/HomePage";
import CartPage from "./pages/CartPage";
import ReservationPage from "./pages/ReservationPage";
import SiparisBasariliPage from "./pages/OrderSuccessPage";
import OrderFailedPage from "./pages/OrderFailedPage";

import LoginPage from "./pages/admin/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import OrdersPage from "./pages/admin/OrdersPage";
import ReservationsPage from "./pages/admin/ReservationsPage";
import PackagesPage from "./pages/admin/PackagesPage";

import ProtectedRoute from "./components/ProtectedRoute";

export const router = createBrowserRouter([
    {
        element: <MainLayout />,
        children: [
            {
                path: "/",
                element: <HomePage />,
            },
            {
                path: "/cart",
                element: <CartPage />,
            },
            {
                path: "/reservation",
                element: <ReservationPage />,
            },
            {
                path: "/siparis-basarili",
                element: <SiparisBasariliPage />,
            },
            {
                path: "/siparis-basarisiz",
                element: <OrderFailedPage />,
            }
        ]
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
                path: "/admin/packages",
                element: <PackagesPage />,
            },
        ]
    }
])