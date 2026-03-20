import { Router } from "express";
import {
  addComment,
  createUploadSignature,
  createVideo,
  getComments,
  getFeed,
  getUserVideos,
  reportVideo,
  shareVideo,
  toggleLike
} from "../controllers/videoController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);
router.get("/feed", getFeed);
router.post("/upload/signature", createUploadSignature);
router.post("/", createVideo);
router.get("/user/:userId", getUserVideos);
router.post("/:videoId/like", toggleLike);
router.get("/:videoId/comments", getComments);
router.post("/:videoId/comments", addComment);
router.post("/:videoId/share", shareVideo);
router.post("/:videoId/report", reportVideo);

export default router;
