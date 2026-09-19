import express from "express";
import {
  createCustomer,
  createStaff,
  deleteCustomer,
  deleteStaff,
  getAllUsers,
  getCustomerStats,
  getStaff,
  getUser,
  sendSetPasswordLink,
  updateCustomer,
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

// "/stats" de "/:id" öncesinde kalmalı — aynı gerekçe
router.get("/stats", getCustomerStats);

router.get("/", getAllUsers);
router.post("/", createCustomer);
router.get("/:id", getUser);
router.patch("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);
router.post("/:id/set-password-link", sendSetPasswordLink);

export default router;
