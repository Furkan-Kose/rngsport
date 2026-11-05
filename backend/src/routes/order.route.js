import express from "express";
import { createOrder, getAllOrders, getOrder, getMyOrders, deleteOrder, updateOrder, getOrderStats, deliverOrder } from "../controllers/order.controller.js";
import { authMiddleware, requireAdmin, optionalAuth } from "../middleware/authMiddleware.js";
import { exportColumnsHandler, exportRecordsHandler } from "../utils/recordExport.js";
import { bulkPreviewHandler, bulkStatusHandler } from "../utils/bulkStatus.js";

const router = express.Router();

router.post("/", optionalAuth, createOrder); // Misafir de sipariş verebilir; girişliyse userId bağlanır
router.get("/", authMiddleware, requireAdmin, getAllOrders);
router.get("/stats", authMiddleware, requireAdmin, getOrderStats); // Dashboard için stats
router.get("/export/columns", authMiddleware, requireAdmin, exportColumnsHandler("order")); // Excel sütun listesi
router.get("/export", authMiddleware, requireAdmin, exportRecordsHandler("order")); // Excel (filtre + sütun seçimi)
router.post("/bulk-status/preview", authMiddleware, requireAdmin, bulkPreviewHandler("order")); // Toplu işlem onay bilgisi
router.post("/bulk-status", authMiddleware, requireAdmin, bulkStatusHandler("order")); // Toplu durum
router.get("/my", authMiddleware, getMyOrders); // /:id'den ÖNCE kayıtlı olmalı
router.get("/:id", getOrder); // Bilinçli olarak public: OrderSuccessPage misafir siparişinde kullanıyor (cuid = capability URL)
router.put("/:id", authMiddleware, requireAdmin, updateOrder);
router.patch("/:id", authMiddleware, requireAdmin, updateOrder); // Admin panel PATCH kullanıyor
router.post("/:id/deliver", authMiddleware, requireAdmin, deliverOrder); // Parça parça teslim + mail
router.delete("/:id", authMiddleware, requireAdmin, deleteOrder);

export default router;
