import express from "express";
import { getAllReservations, getReservation, createReservation, updateReservation, deleteReservation, getReservationStats } from "../controllers/reservation.controller.js";

const router = express.Router();

router.get("/", getAllReservations);
router.get("/stats", getReservationStats); // Dashboard için stats
router.get("/:id", getReservation);
router.post("/", createReservation);
router.delete("/:id", deleteReservation);
router.put("/:id", updateReservation);

export default router;