import { Router } from "express";
import {
  deleteUser,
  deleteVideo,
  getReports,
  getStats,
  getUsers,
  getVideos,
  moderateVideo,
  updateReport,
  updateUserStatus
} from "../controllers/adminController.js";
import { protect, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.use(protect, requireAdmin);
router.get("/stats", getStats);
router.get("/users", getUsers);
router.patch("/users/:userId/status", updateUserStatus);
router.delete("/users/:userId", deleteUser);
router.get("/videos", getVideos);
router.patch("/videos/:videoId", moderateVideo);
router.delete("/videos/:videoId", deleteVideo);
router.get("/reports", getReports);
router.patch("/reports/:reportId", updateReport);

export default router;
