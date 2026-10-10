import express from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import {
  login,
  logout,
  register,
  getMe,
  updateMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  claimAccount,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

const WINDOW_MS = 15 * 60 * 1000;
const LIMIT_MESSAGE = {
  success: false,
  message: "Çok fazla deneme, lütfen daha sonra tekrar deneyin",
};
const limiter = (options) =>
  rateLimit({
    windowMs: WINDOW_MS,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: LIMIT_MESSAGE,
    ...options,
  });

// IP başına genel tavan. Yarışma salonunda veliler aynı Wi-Fi'den, mobil operatörler
// de çok kullanıcıyı tek IP'den (CGNAT) çıkarıyor — eskiden IP başına 20 deneme
// olan sınır, salondaki herkesi aynı anda kilitliyordu. Bu tavan sadece toplu
// kötüye kullanımı (bot) keser.
const ipLimiter = limiter({ limit: 200 });

// Hesap bazlı brute-force koruması: aynı IP'den AYNI hesaba 15 dakikada 10 başarısız
// deneme. Başarılı girişler sayılmaz; farklı veliler birbirini engellemez.
const perAccountKey = (field) => (req) =>
  `${ipKeyGenerator(req.ip)}:${String(req.body?.[field] ?? req.body?.email ?? "").trim().toLowerCase()}`;
const loginLimiter = limiter({
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: perAccountKey("identifier"),
});

// Şifre sıfırlama maili: aynı adrese 15 dakikada 5 istek (mail kotası/spam koruması)
const forgotLimiter = limiter({ limit: 5, keyGenerator: perAccountKey("email") });

router.post("/login", ipLimiter, loginLimiter, login);
router.post("/register", ipLimiter, register);
router.post("/logout", logout);
router.get("/me", authMiddleware, getMe);
// Profil düzenleme (e-posta/rol/şifre hariç)
router.patch("/me", authMiddleware, updateMe);

// E-posta doğrulama + şifre akışları
router.post("/verify-email", ipLimiter, verifyEmail);
router.post("/resend-verification", ipLimiter, authMiddleware, resendVerification);
router.post("/forgot-password", ipLimiter, forgotLimiter, forgotPassword);
router.post("/reset-password", ipLimiter, resetPassword);
router.post("/change-password", authMiddleware, changePassword);
// Sipariş/rezervasyon başarı ekranından şifresiz hesabı sahiplenme
router.post("/claim-account", ipLimiter, claimAccount);

export default router;
