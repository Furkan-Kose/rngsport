import express from "express";
import multer from "multer";
import {
  clearShootingList,
  exportShootingList,
  getShootingList,
  streamShootingList,
  updateShootingEntry,
  uploadShootingList,
} from "../controllers/shootingList.controller.js";
import {
  authMiddleware,
  requireAdmin,
  requireRoles,
} from "../middleware/authMiddleware.js";
import { SHOOTING_LIST_ROLES } from "../utils/roles.js";

const router = express.Router();

// Giriş her endpoint için zorunlu; yetki route bazında (SSE /stream dahil —
// client EventSource withCredentials kullandığı için cookie auth yeterli)
router.use(authMiddleware);

// Okuma + kendi çekim saatini işaretleme: admin, fotografci, videocu
const canViewList = requireRoles(...SHOOTING_LIST_ROLES);

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

router.get("/stream", canViewList, streamShootingList);
router.get("/", canViewList, getShootingList);
router.patch("/:id", canViewList, updateShootingEntry);

// Liste yönetimi sadece admin'de
router.get("/export", requireAdmin, exportShootingList);
router.post("/upload", requireAdmin, upload.single("file"), uploadShootingList);
router.delete("/", requireAdmin, clearShootingList);

export default router;
