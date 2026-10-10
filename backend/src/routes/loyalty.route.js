import express from "express";
import {
  getTiers,
  getMyLoyalty,
  createTier,
  updateTier,
  deleteTier,
  getUserLoyalty,
  adjustUserPoints,
} from "../controllers/loyalty.controller.js";
import { authMiddleware, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();
const admin = [authMiddleware, requireAdmin];

router.get("/tiers", getTiers); // Public: formda indirim/seviye göstermek için
router.get("/me", authMiddleware, getMyLoyalty);

router.post("/tiers", ...admin, createTier);
router.put("/tiers/:id", ...admin, updateTier);
router.delete("/tiers/:id", ...admin, deleteTier);
router.get("/users/:userId", ...admin, getUserLoyalty);
router.post("/users/:userId/adjust", ...admin, adjustUserPoints);

export default router;
