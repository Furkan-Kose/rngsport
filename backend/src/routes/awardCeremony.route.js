import express from "express";
import {
  getAllCeremonies,
  getCeremonyBySlug,
  downloadCeremonyPhoto,
  downloadAllCeremonyPhotos,
  getCeremonyZipManifest,
  getCeremonyAdmin,
  createCeremony,
  updateCeremony,
  deleteCeremony,
  presignCeremonyUploads,
  confirmCeremonyUploads,
  deleteCeremonyPhoto,
  getCeremonyMissingPreviews,
  saveCeremonyPreviews,
  deleteAllCeremonyPhotos,
} from "../controllers/awardCeremony.controller.js";
import { authMiddleware, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();
const admin = [authMiddleware, requireAdmin];

// Admin — /admin/* ve /photos/* rotaları /:slug'dan ÖNCE tanımlı olmalı
router.get("/admin/:id", ...admin, getCeremonyAdmin);
router.get("/admin/:id/missing-previews", ...admin, getCeremonyMissingPreviews);
router.post("/", ...admin, createCeremony);
router.put("/:id", ...admin, updateCeremony);
router.delete("/photos/:photoId", ...admin, deleteCeremonyPhoto);
router.delete("/:id/photos", ...admin, deleteAllCeremonyPhotos);
router.delete("/:id", ...admin, deleteCeremony);
router.post("/:id/presign", ...admin, presignCeremonyUploads);
router.post("/:id/confirm", ...admin, confirmCeremonyUploads);
router.post("/:id/previews", ...admin, saveCeremonyPreviews);

// Public — giriş gerekmez
router.get("/", getAllCeremonies);
router.get("/:slug", getCeremonyBySlug);
router.get("/:slug/download-manifest", getCeremonyZipManifest);
router.get("/:slug/download-all", downloadAllCeremonyPhotos);
router.get("/:slug/photos/:photoId/download", downloadCeremonyPhoto);

export default router;
