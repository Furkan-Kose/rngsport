import express from "express";
import { createOrder, getAllOrders, getOrder, getMyOrders, deleteOrder, updateOrder, getOrderStats } from "../controllers/order.controller.js";
import { authMiddleware, requireAdmin, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", optionalAuth, createOrder); // Misafir de sipariş verebilir; girişliyse userId bağlanır
router.get("/", authMiddleware, requireAdmin, getAllOrders);
router.get("/stats", authMiddleware, requireAdmin, getOrderStats); // Dashboard için stats
router.get("/my", authMiddleware, getMyOrders); // /:id'den ÖNCE kayıtlı olmalı
router.get("/:id", getOrder); // Bilinçli olarak public: OrderSuccessPage misafir siparişinde kullanıyor (cuid = capability URL)
router.put("/:id", authMiddleware, requireAdmin, updateOrder);
router.patch("/:id", authMiddleware, requireAdmin, updateOrder); // Admin panel PATCH kullanıyor
router.delete("/:id", authMiddleware, requireAdmin, deleteOrder);

export default router;
