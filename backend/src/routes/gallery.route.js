import express from "express";
import {
  getMyPhotos,
  downloadMyPhoto,
  downloadAllMyPhotos,
  presignPhotoUploads,
  confirmPhotoUploads,
  getUserPhotosAdmin,
  deletePhoto,
} from "../controllers/gallery.controller.js";
import { authMiddleware, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Müşteri
router.get("/my", authMiddleware, getMyPhotos);
router.get("/my/download-all", authMiddleware, downloadAllMyPhotos);
router.get("/my/:id/download", authMiddleware, downloadMyPhoto);

// Admin
router.post("/admin/presign", authMiddleware, requireAdmin, presignPhotoUploads);
router.post("/admin/confirm", authMiddleware, requireAdmin, confirmPhotoUploads);
router.get("/admin/user/:userId", authMiddleware, requireAdmin, getUserPhotosAdmin);
router.delete("/admin/photo/:id", authMiddleware, requireAdmin, deletePhoto);

export default router;
