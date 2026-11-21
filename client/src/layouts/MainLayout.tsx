import { Outlet, ScrollRestoration, useLocation } from "react-router";
import { MotionConfig, motion } from "framer-motion";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WpButton from "../components/WpButton";
import LangSuggestBanner from "../components/LangSuggestBanner";
import { PAGE } from "../lib/motion";

const MainLayout = () => {
  const { pathname } = useLocation();

  return (
    // reducedMotion="user": işletim sisteminde "hareketi azalt" açıksa animasyonlar kapanır
    <MotionConfig reducedMotion="user">
      {/* "site": index.css'teki müşteri sitesi tipografisi ve klavye odağı halkası.
          overflow-x-clip (hidden DEĞİL): hidden bu kutuyu kaydırma kabı yapar ve içerideki
          tüm `sticky` öğeleri (sepet / rezervasyon özeti, profil yan sütunu) bozar. */}
      <main className="site bg-zinc-950 text-zinc-100 min-h-screen flex flex-col relative overflow-x-clip">
        <ScrollRestoration />
        <Header />
        {/* Sayfa girişi: her sayfa aynı kısa belirmeyle açılır (lib/motion.ts) */}
        <motion.div
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: PAGE.duration, ease: "easeOut" }}
          className="grow relative"
        >
          <Outlet />
        </motion.div>
        <Footer />
        <WpButton />
        <LangSuggestBanner />
      </main>
    </MotionConfig>
  );
};

export default MainLayout;
