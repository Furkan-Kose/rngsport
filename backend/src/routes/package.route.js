import express from "express";
import {
  getAllPackages,
  getAllPackagesAdmin,
  getPackage,
  createPackage,
  updatePackage,
  deletePackage,
  presignPackageImage,
  servePackageImage,
} from "../controllers/package.controller.js";
import { authMiddleware, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllPackages);
router.get("/all", authMiddleware, requireAdmin, getAllPackagesAdmin); // Admin için tüm paketler (pasif dahil)
router.get("/image/:file", servePackageImage); // Public: R2'deki paket görseli (sabit URL, cache'lenir)
router.post("/upload-image", authMiddleware, requireAdmin, presignPackageImage);
router.get("/:id", getPackage);
router.post("/", authMiddleware, requireAdmin, createPackage);
router.delete("/:id", authMiddleware, requireAdmin, deletePackage);
router.put("/:id", authMiddleware, requireAdmin, updatePackage);

export default router;
