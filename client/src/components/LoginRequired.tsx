import { useLocation } from "react-router";
import ProtectedRoute from "./ProtectedRoute";
import { useLang } from "../lib/localePath";

// Adresi değişen müşteri sayfaları (/urunler/:slug/siparis, /urun-siparisi/:id) için:
// girişsiz ziyaretçi giriş sayfasına gider, girişten sonra tam olarak buraya döner.
const LoginRequired = ({ children }: { children: React.ReactNode }) => {
  const { pathname, search } = useLocation();
  const lang = useLang();
  const prefix = lang === "tr" ? "" : `/${lang}`;
  const redirect = encodeURIComponent(`${pathname}${search}`);
  return <ProtectedRoute redirectTo={`${prefix}/giris?redirect=${redirect}`}>{children}</ProtectedRoute>;
};

export default LoginRequired;
