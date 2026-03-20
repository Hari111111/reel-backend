import { Router } from "express";
import {
  uploadChatAttachment,
  uploadChatAttachmentMiddleware,
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
router.post("/chat-attachment", uploadChatAttachmentMiddleware, uploadChatAttachment);

export default router;
