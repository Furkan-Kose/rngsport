import express from "express";
import {
  createStaff,
  deleteStaff,
  getAllUsers,
  getStaff,
  getUser,
  updateStaff,
} from "../controllers/user.controller.js";
import { authMiddleware, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware, requireAdmin);

// Personel uçları "/:id" öncesinde tanımlanmalı, yoksa /staff bir id sanılır
router.get("/staff", getStaff);
router.post("/staff", createStaff);
router.patch("/staff/:id", updateStaff);
router.delete("/staff/:id", deleteStaff);

router.get("/", getAllUsers);
router.get("/:id", getUser);

export default router;
