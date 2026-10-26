import express from "express";
import {
  listProducts,
  getProduct,
  serveProductImage,
  createOrder,
  getMyOrders,
  getMyOrder,
  getLastAddress,
  startCheckout,
  paymentCallback,
  listProductsAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  presignProductImage,
  listOrdersAdmin,
  updateOrderAdmin,
  deleteOrderAdmin,
} from "../controllers/shop.controller.js";
import { authMiddleware, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();
const admin = [authMiddleware, requireAdmin];

// Public
router.get("/products", listProducts);
router.get("/products/:slug", getProduct);
router.get("/image/:file", serveProductImage); // R2'deki ürün görseli (sabit URL, cache'lenir)

// iyzico doğrudan POST eder — CORS'tan muaf (src/index.js), giriş yok
router.post("/payment/callback", paymentCallback);

// Müşteri (giriş zorunlu)
router.get("/last-address", authMiddleware, getLastAddress);
router.get("/orders/my", authMiddleware, getMyOrders);
router.post("/orders", authMiddleware, createOrder);
router.get("/orders/:id", authMiddleware, getMyOrder);
router.post("/orders/:id/checkout", authMiddleware, startCheckout);

// Admin
router.get("/admin/products", ...admin, listProductsAdmin);
router.post("/admin/products", ...admin, createProduct);
router.post("/admin/products/upload-image", ...admin, presignProductImage);
router.put("/admin/products/:id", ...admin, updateProduct);
router.delete("/admin/products/:id", ...admin, deleteProduct);
router.get("/admin/orders", ...admin, listOrdersAdmin);
router.patch("/admin/orders/:id", ...admin, updateOrderAdmin);
router.delete("/admin/orders/:id", ...admin, deleteOrderAdmin);

export default router;
