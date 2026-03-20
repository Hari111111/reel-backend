import { Router } from "express";
import { createPost, getPostsFeed, getUserPosts } from "../controllers/postController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);
router.get("/feed", getPostsFeed);
router.get("/user/:userId", getUserPosts);
router.post("/", createPost);

export default router;
