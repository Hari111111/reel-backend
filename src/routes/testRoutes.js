import { Router } from "express";
import { User } from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);

// Test endpoint to check API response structure
router.get("/test-search", async (req, res) => {
  try {
    const users = await User.find({}).select("name username avatarUrl _id").limit(5);
    
    // Simulate the same structure as searchUsers
    const mockResponse = {
      docs: users.map(u => ({
        id: u._id,
        name: u.name,
        username: u.username,
        avatarUrl: u.avatarUrl
      })),
      total: users.length,
      page: 1,
      limit: 5
    };
    
    console.log('Test search response:', JSON.stringify(mockResponse, null, 2));
    res.json(mockResponse);
  } catch (error) {
    console.error("Test search error:", error);
    res.status(500).json({ error: "Test failed" });
  }
});

export default router;
