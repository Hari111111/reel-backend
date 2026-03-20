import asyncHandler from "express-async-handler";
import { Notification } from "../models/Notification.js";
import { Follow } from "../models/Follow.js";
import { User } from "../models/User.js";
import { Video } from "../models/Video.js";
import { createNotification } from "../services/notificationService.js";
import { buildPagination, createPaginatedResponse } from "../utils/apiFeatures.js";

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await User.findById(req.params.userId).select("-password");

  if (!profile) {
    res.status(404);
    throw new Error("User not found");
  }

  const isFollowing = Boolean(
    await Follow.findOne({ follower: req.user._id, following: req.params.userId })
  );

  res.json({
    profile: {
      id: profile._id,
      name: profile.name,
      username: profile.username,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      followersCount: profile.followersCount,
      followingCount: profile.followingCount,
      videosCount: profile.videosCount,
      isFollowing
    }
  });
});

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

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, username, bio, avatarUrl } = req.body;
  const userId = req.user._id;

  // Validate required fields
  if (!name || !name.trim()) {
    res.status(400);
    throw new Error("Name is required");
  }

  if (!username || !username.trim()) {
    res.status(400);
    throw new Error("Username is required");
  }

  if (username.length < 3) {
    res.status(400);
    throw new Error("Username must be at least 3 characters");
  }

  // Check username uniqueness (exclude current user)
  const existingUser = await User.findOne({
    username: username.toLowerCase().trim(),
    _id: { $ne: userId }
  });

  if (existingUser) {
    res.status(409);
    throw new Error("Username already taken");
  }

  // Prepare updates
  const updates = {
    name: name.trim(),
    username: username.toLowerCase().trim(),
    bio: bio?.trim() || "",
    avatarUrl: avatarUrl?.trim() || ""
  };

  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true
  }).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json({ user: sanitizeUser(user) });
});

export const toggleFollow = asyncHandler(async (req, res) => {
  const targetUser = await User.findById(req.params.userId);

  if (!targetUser || String(targetUser._id) === String(req.user._id)) {
    res.status(400);
    throw new Error("Invalid follow request");
  }

  const existing = await Follow.findOne({
    follower: req.user._id,
    following: targetUser._id
  });

  if (existing) {
    await existing.deleteOne();
    await Promise.all([
      User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: -1 } }),
      User.findByIdAndUpdate(targetUser._id, { $inc: { followersCount: -1 } })
    ]);
    res.json({ following: false });
    return;
  }

  await Follow.create({ follower: req.user._id, following: targetUser._id });
  await Promise.all([
    User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: 1 } }),
    User.findByIdAndUpdate(targetUser._id, { $inc: { followersCount: 1 } })
  ]);
  await createNotification({
    userId: targetUser._id,
    actorId: req.user._id,
    type: "follow",
    message: `${req.user.username} started following you`
  });

  res.json({ following: true });
});

export const searchUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query.page, req.query.limit);
  const search = req.query.q?.trim();

  const query = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } }
        ]
      }
    : {};

  const [users, total] = await Promise.all([
    User.find(query).select("name username avatarUrl followersCount").sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query)
  ]);

  res.json(createPaginatedResponse({ docs: users, total, page, limit }));
});

export const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query.page, req.query.limit);
  const query = { user: req.user._id };

  const [notifications, total] = await Promise.all([
    Notification.find(query)
      .populate("actor", "name username avatarUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(query)
  ]);

  res.json(createPaginatedResponse({ docs: notifications, total, page, limit }));
});

export const getProfileVideosSummary = asyncHandler(async (req, res) => {
  const totalViews = await Video.aggregate([
    { $match: { user: req.user._id } },
    { $group: { _id: null, viewsCount: { $sum: "$viewsCount" }, likesCount: { $sum: "$likesCount" } } }
  ]);

  res.json({ summary: totalViews[0] || { viewsCount: 0, likesCount: 0 } });
});
