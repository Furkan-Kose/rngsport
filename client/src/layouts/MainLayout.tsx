import { Outlet, ScrollRestoration } from "react-router"
import Header from "../components/Header"
import Footer from "../components/Footer"
import WpButton from "../components/WpButton"

const MainLayout = () => {
  return (
    <main className="bg-black min-h-screen flex flex-col">
      <ScrollRestoration />
      <Header />
      <div className="grow">
        <Outlet />
      </div>
      <Footer />
      <WpButton />
    </main>
  )
}

export default MainLayout