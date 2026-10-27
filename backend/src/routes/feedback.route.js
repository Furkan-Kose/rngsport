import express from "express";
import {
  createFeedback,
  getAllFeedback,
  updateFeedback,
  deleteFeedback,
} from "../controllers/feedback.controller.js";
import { authMiddleware, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createFeedback); // Girişli müşteri (Galerim formu); 24 saatte en fazla 5
router.get("/", authMiddleware, requireAdmin, getAllFeedback);
router.patch("/:id", authMiddleware, requireAdmin, updateFeedback);
router.delete("/:id", authMiddleware, requireAdmin, deleteFeedback);

export default router;
