import express from "express";
import {
  getAllReservations,
  getReservation,
  getMyReservations,
  updateMyReservation,
  deleteMyReservation,
  createReservation,
  updateReservation,
  deleteReservation,
  deliverReservation,
  getReservationStats,
} from "../controllers/reservation.controller.js";
import { authMiddleware, requireAdmin, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, requireAdmin, getAllReservations);
router.get("/stats", authMiddleware, requireAdmin, getReservationStats); // Dashboard için stats
// /my rotaları /:id'den ÖNCE kayıtlı olmalı
router.get("/my", authMiddleware, getMyReservations);
router.put("/my/:id", authMiddleware, updateMyReservation); // Müşteri: ödeme öncesi düzenleme
router.delete("/my/:id", authMiddleware, deleteMyReservation);
router.get("/:id", getReservation); // Bilinçli olarak public (cuid = capability URL)
router.post("/", optionalAuth, createReservation); // Misafir de rezervasyon yapabilir; girişliyse userId bağlanır
router.delete("/:id", authMiddleware, requireAdmin, deleteReservation);
router.put("/:id", authMiddleware, requireAdmin, updateReservation);
router.post("/:id/deliver", authMiddleware, requireAdmin, deliverReservation); // Parça parça teslim + mail

export default router;
