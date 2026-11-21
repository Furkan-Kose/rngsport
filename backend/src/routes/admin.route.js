import express from "express";
import { getBadges, markBadgeSeen, globalSearch, getTournamentSummary } from "../controllers/admin.controller.js";
import { authMiddleware, requireAdmin } from "../middleware/authMiddleware.js";

// Admin paneli yardımcıları: menü rozetleri ve hızlı arama (Ctrl+K)
const router = express.Router();
router.use(authMiddleware, requireAdmin);

router.get("/badges", getBadges);
router.post("/badges/seen", markBadgeSeen);
router.get("/search", globalSearch);
router.get("/tournament-summary", getTournamentSummary); // Ana sayfa: paket / alet / kulüp dağılımı

export default router;
