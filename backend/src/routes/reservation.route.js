import express from "express";
import { getAllReservations, getReservation, getMyReservations, createReservation, updateReservation, deleteReservation, getReservationStats } from "../controllers/reservation.controller.js";
import { authMiddleware, requireAdmin, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, requireAdmin, getAllReservations);
router.get("/stats", authMiddleware, requireAdmin, getReservationStats); // Dashboard için stats
router.get("/my", authMiddleware, getMyReservations); // /:id'den ÖNCE kayıtlı olmalı
router.get("/:id", getReservation); // Bilinçli olarak public (cuid = capability URL)
router.post("/", optionalAuth, createReservation); // Misafir de rezervasyon yapabilir; girişliyse userId bağlanır
router.delete("/:id", authMiddleware, requireAdmin, deleteReservation);
router.put("/:id", authMiddleware, requireAdmin, updateReservation);

export default router;
