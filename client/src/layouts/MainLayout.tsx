import { Outlet, ScrollRestoration } from "react-router";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WpButton from "../components/WpButton";
import Snowfall from "../components/Snowfall";

const MainLayout = () => {
  return (
    <main className="bg-black min-h-screen flex flex-col relative overflow-x-hidden">
      <Snowfall />
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
