import express from "express";
import {
  getAllTournaments,
  createTournament,
  updateTournament,
  deleteTournament,
} from "../controllers/tournament.controller.js";
import { authMiddleware, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllTournaments); // Public: ana sayfa takvimi
router.post("/", authMiddleware, requireAdmin, createTournament);
router.put("/:id", authMiddleware, requireAdmin, updateTournament);
router.delete("/:id", authMiddleware, requireAdmin, deleteTournament);

export default router;
