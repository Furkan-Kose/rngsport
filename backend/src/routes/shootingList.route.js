import express from "express";
import multer from "multer";
import {
  clearShootingList,
  getShootingList,
  streamShootingList,
  updateShootingEntry,
  uploadShootingList,
} from "../controllers/shootingList.controller.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "application/octet-stream",
    ];
    if (allowed.includes(file.mimetype) || /\.(xlsx|xls)$/i.test(file.originalname)) {
      return cb(null, true);
    }
    cb(new Error("Sadece Excel dosyası (.xlsx / .xls) yükleyebilirsiniz"));
  },
});

router.get("/stream", streamShootingList);
router.get("/", getShootingList);
router.post("/upload", upload.single("file"), uploadShootingList);
router.delete("/", clearShootingList);
router.patch("/:id", updateShootingEntry);

export default router;
