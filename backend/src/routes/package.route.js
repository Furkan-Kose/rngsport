import express from "express";
import { getAllPackages, getAllPackagesAdmin, getPackage, createPackage, updatePackage, deletePackage } from "../controllers/package.controller.js";

const router = express.Router();

router.get("/", getAllPackages);
router.get("/all", getAllPackagesAdmin); // Admin için tüm paketler (pasif dahil)
router.get("/:id", getPackage);
router.post("/", createPackage);
router.delete("/:id", deletePackage);
router.put("/:id", updatePackage);

export default router;