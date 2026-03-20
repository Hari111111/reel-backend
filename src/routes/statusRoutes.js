import { Router } from "express";
import { createStatus, getStatusesFeed, getUserStatuses } from "../controllers/statusController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);
router.get("/feed", getStatusesFeed);
router.get("/user/:userId", getUserStatuses);
router.post("/", createStatus);

export default router;
