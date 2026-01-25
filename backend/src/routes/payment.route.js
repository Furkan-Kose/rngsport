import express from "express";
import { createCheckoutForm, paymentCallback, checkPaymentStatus } from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/checkout", createCheckoutForm);
router.post("/callback", paymentCallback);
router.get("/status/:orderId", checkPaymentStatus);

export default router;
