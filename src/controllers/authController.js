import asyncHandler from "express-async-handler";
import { User } from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  username: user.username,
  bio: user.bio,
  avatarUrl: user.avatarUrl,
  followersCount: user.followersCount,
  followingCount: user.followingCount,
  videosCount: user.videosCount,
  role: user.role
});

export const signup = asyncHandler(async (req, res) => {
  const { name, email, username, password } = req.body;

  const exists = await User.findOne({
    $or: [{ email: email?.toLowerCase() }, { username: username?.toLowerCase() }]
  });

  if (exists) {
    res.status(409);
    throw new Error("User already exists");
  }

  const user = await User.create({ name, email, username, password });

  res.status(201).json({
    token: generateToken({ id: user._id, role: user.role }),
    user: sanitizeUser(user)
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() }).select("+password");

  if (!user || !(await user.comparePassword(password)) || user.isBlocked) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  res.json({
    token: generateToken({ id: user._id, role: user.role }),
    user: sanitizeUser(user)
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});
