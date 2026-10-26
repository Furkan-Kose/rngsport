import express from "express";
import {
  getMyPhotos,
  downloadMyPhoto,
  downloadAllMyPhotos,
  getMyZipManifest,
  presignPhotoUploads,
  confirmPhotoUploads,
  getUserPhotosAdmin,
  deletePhoto,
  getMissingPreviews,
  saveMissingPreviews,
  deleteAllUserPhotos,
} from "../controllers/gallery.controller.js";
import { authMiddleware, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Müşteri
router.get("/my", authMiddleware, getMyPhotos);
router.get("/my/download-manifest", authMiddleware, getMyZipManifest);
router.post("/my/download-manifest", authMiddleware, getMyZipManifest); // seçilenler: { ids }
router.get("/my/download-all", authMiddleware, downloadAllMyPhotos);
router.get("/my/:id/download", authMiddleware, downloadMyPhoto);

// Admin
router.post("/admin/presign", authMiddleware, requireAdmin, presignPhotoUploads);
router.post("/admin/confirm", authMiddleware, requireAdmin, confirmPhotoUploads);
router.get("/admin/user/:userId", authMiddleware, requireAdmin, getUserPhotosAdmin);
router.delete("/admin/photo/:id", authMiddleware, requireAdmin, deletePhoto);
router.get("/admin/user/:userId/missing-previews", authMiddleware, requireAdmin, getMissingPreviews);
router.post("/admin/user/:userId/previews", authMiddleware, requireAdmin, saveMissingPreviews);
router.delete("/admin/user/:userId/photos", authMiddleware, requireAdmin, deleteAllUserPhotos);

export default router;
