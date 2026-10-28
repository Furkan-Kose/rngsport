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
  getMyShares,
  createMyShare,
  revokeMyShare,
  getSharedGallery,
  getSharedZipManifest,
  downloadSharedPhoto,
  getUserDownloadsAdmin,
  moveUserPhotos,
  deleteSelectedUserPhotos,
  getRecentAlbums,
} from "../controllers/gallery.controller.js";
import { authMiddleware, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Müşteri
router.get("/my", authMiddleware, getMyPhotos);
router.get("/my/download-manifest", authMiddleware, getMyZipManifest);
router.post("/my/download-manifest", authMiddleware, getMyZipManifest); // seçilenler: { ids }
router.get("/my/download-all", authMiddleware, downloadAllMyPhotos);
router.get("/my/:id/download", authMiddleware, downloadMyPhoto);
// Paylaşım linki (sahibi): kapsam başına tek aktif link, 30 gün, iptal edilebilir
router.get("/my/shares", authMiddleware, getMyShares);
router.post("/my/shares", authMiddleware, createMyShare);
router.delete("/my/shares/:id", authMiddleware, revokeMyShare);

// Paylaşılan galeri — girişsiz, salt okunur. Sunucu zip'i (download-all) bilerek yok.
router.get("/shared/:token", getSharedGallery);
router.get("/shared/:token/download-manifest", getSharedZipManifest);
router.post("/shared/:token/download-manifest", getSharedZipManifest); // seçilenler: { ids }
router.get("/shared/:token/:id/download", downloadSharedPhoto);

// Admin
router.post("/admin/presign", authMiddleware, requireAdmin, presignPhotoUploads);
router.post("/admin/confirm", authMiddleware, requireAdmin, confirmPhotoUploads);
router.get("/admin/user/:userId", authMiddleware, requireAdmin, getUserPhotosAdmin);
router.get("/admin/user/:userId/downloads", authMiddleware, requireAdmin, getUserDownloadsAdmin);
router.get("/admin/albums", authMiddleware, requireAdmin, getRecentAlbums);
router.post("/admin/user/:userId/photos/move", authMiddleware, requireAdmin, moveUserPhotos);
router.post("/admin/user/:userId/photos/delete", authMiddleware, requireAdmin, deleteSelectedUserPhotos);
router.delete("/admin/photo/:id", authMiddleware, requireAdmin, deletePhoto);
router.get("/admin/user/:userId/missing-previews", authMiddleware, requireAdmin, getMissingPreviews);
router.post("/admin/user/:userId/previews", authMiddleware, requireAdmin, saveMissingPreviews);
router.delete("/admin/user/:userId/photos", authMiddleware, requireAdmin, deleteAllUserPhotos);

export default router;
