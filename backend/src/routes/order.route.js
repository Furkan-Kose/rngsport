import express from "express";
import { createOrder, getAllOrders, getOrder, deleteOrder, updateOrder, getOrderStats } from "../controllers/order.controller.js";

const router = express.Router();

router.post("/", createOrder);
router.get("/", getAllOrders);
router.get("/stats", getOrderStats); // Dashboard için stats
router.get("/:id", getOrder);
router.put("/:id", updateOrder);
router.delete("/:id", deleteOrder);

export default router;
