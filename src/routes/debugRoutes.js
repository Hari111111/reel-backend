import { Router } from "express";
import { User } from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);

// Debug endpoint to get all users (for development)
router.get("/all", async (req, res) => {
  try {
    const users = await User.find({}).select("name username avatarUrl _id").limit(20);
    res.json({
      users: users.map(u => ({
        id: u._id,
        name: u.name,
        username: u.username,
        avatar: u.avatarUrl || "https://via.placeholder.com/50"
      })),
      total: users.length
    });
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;
