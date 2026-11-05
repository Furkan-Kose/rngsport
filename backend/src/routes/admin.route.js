import express from "express";
import { getBadges, markBadgeSeen, globalSearch } from "../controllers/admin.controller.js";
import { authMiddleware, requireAdmin } from "../middleware/authMiddleware.js";

// Admin paneli yardımcıları: menü rozetleri ve hızlı arama (Ctrl+K)
const router = express.Router();
router.use(authMiddleware, requireAdmin);

router.get("/badges", getBadges);
router.post("/badges/seen", markBadgeSeen);
router.get("/search", globalSearch);

export default router;
