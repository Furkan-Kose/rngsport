import express from "express";
import rateLimit from "express-rate-limit";
import {
  login,
  logout,
  register,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Brute-force koruması: IP başına 15 dakikada 20 deneme
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Çok fazla deneme, lütfen daha sonra tekrar deneyin" },
});

router.post("/login", authLimiter, login);
router.post("/register", authLimiter, register);
router.post("/logout", logout);
router.get("/me", authMiddleware, getMe);

// E-posta doğrulama + şifre akışları
router.post("/verify-email", authLimiter, verifyEmail);
router.post("/resend-verification", authLimiter, authMiddleware, resendVerification);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/change-password", authMiddleware, changePassword);

export default router;
