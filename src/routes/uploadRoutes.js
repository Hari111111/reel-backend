import { Router } from "express";
import { uploadImage, uploadMiddleware } from "../controllers/uploadController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);
router.post("/image", uploadMiddleware, uploadImage);

export default router;
