import { Router } from "express";
import {
  uploadImage,
  uploadImageMiddleware,
  uploadPostImage,
  uploadVideo,
  uploadVideoMiddleware
} from "../controllers/uploadController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);
router.post("/image", uploadImageMiddleware, uploadImage);
router.post("/post-image", uploadImageMiddleware, uploadPostImage);
router.post("/video", uploadVideoMiddleware, uploadVideo);

export default router;
