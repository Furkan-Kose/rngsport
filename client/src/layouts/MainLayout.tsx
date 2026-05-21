import { Outlet, ScrollRestoration } from "react-router";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WpButton from "../components/WpButton";

const MainLayout = () => {
  return (
    <main className="bg-black min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Global subtle texture layer (very faint, masked at edges) */}
      <div
        aria-hidden
        className="fixed inset-0 bg-grid-dark opacity-30 pointer-events-none z-0"
      />

      <ScrollRestoration />
      <Header />
      <div className="grow relative z-10">
        <Outlet />
      </div>
      <Footer />
      <WpButton />
    </main>
  );
};

export default MainLayout;
