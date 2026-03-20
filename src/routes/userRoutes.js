import { Router } from "express";
import {
  getNotifications,
  getProfile,
  getProfileVideosSummary,
  searchUsers,
  toggleFollow,
  updateProfile
} from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);
router.get("/search", searchUsers);
router.get("/notifications", getNotifications);
router.get("/summary", getProfileVideosSummary);
router.put("/me", updateProfile);
router.get("/:userId", getProfile);
router.post("/:userId/follow", toggleFollow);

export default router;
