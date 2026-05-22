import { RouterProvider } from "react-router"
import { router } from "./Router"
import { CartProvider } from "./context/CartContext"
import { AuthProvider } from "./context/AuthContext"
import { Slide, ToastContainer } from "react-toastify"

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <RouterProvider router={router} />
        <ToastContainer 
          position="top-right"
          autoClose={2000}
          hideProgressBar
          theme="dark"
          transition={Slide}
        />
      </CartProvider>
    </AuthProvider>
  )
}

export default App