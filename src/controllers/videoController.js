import asyncHandler from "express-async-handler";
import cloudinary from "../config/cloudinary.js";
import { Comment } from "../models/Comment.js";
import { Like } from "../models/Like.js";
import { Report } from "../models/Report.js";
import { User } from "../models/User.js";
import { Video } from "../models/Video.js";
import { createNotification } from "../services/notificationService.js";
import { buildPagination, createPaginatedResponse } from "../utils/apiFeatures.js";
import { getRankedFeed } from "../services/feedService.js";

export const createUploadSignature = asyncHandler(async (req, res) => {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = `reels/${req.user._id}`;
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder, resource_type: "video" },
    cloudinary.config().api_secret
  );

  res.json({
    timestamp,
    folder,
    signature,
    cloudName: cloudinary.config().cloud_name,
    apiKey: cloudinary.config().api_key
  });
});

export const createVideo = asyncHandler(async (req, res) => {
  const video = await Video.create({
    user: req.user._id,
    caption: req.body.caption,
    videoUrl: req.body.videoUrl,
    videoPublicId: req.body.videoPublicId,
    thumbnailUrl: req.body.thumbnailUrl,
    thumbnailPublicId: req.body.thumbnailPublicId,
    duration: req.body.duration,
    tags: req.body.tags || []
  });

  await User.findByIdAndUpdate(req.user._id, { $inc: { videosCount: 1 } });

  const populated = await video.populate("user", "name username avatarUrl");
  res.status(201).json({ video: populated });
});

export const getFeed = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query.page, req.query.limit);
  const feed = await getRankedFeed({ userId: req.user._id, page, limit, skip });

  res.json(createPaginatedResponse(feed));
});

export const getUserVideos = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query.page, req.query.limit);
  const query = { user: req.params.userId, status: "active" };

  const [videos, total] = await Promise.all([
    Video.find(query).populate("user", "name username avatarUrl").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Video.countDocuments(query)
  ]);

  res.json(createPaginatedResponse({ docs: videos, total, page, limit }));
});

export const toggleLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const existing = await Like.findOne({ user: req.user._id, video: videoId });
  const video = await Video.findById(videoId).populate("user", "name username");

  if (!video) {
    res.status(404);
    throw new Error("Video not found");
  }

  if (existing) {
    await existing.deleteOne();
    await Video.findByIdAndUpdate(videoId, { $inc: { likesCount: -1 } });
    res.json({ liked: false });
    return;
  }

  await Like.create({ user: req.user._id, video: videoId });
  await Video.findByIdAndUpdate(videoId, { $inc: { likesCount: 1 } });
  await createNotification({
    userId: video.user._id,
    actorId: req.user._id,
    type: "like",
    message: `${req.user.username} liked your reel`,
    metadata: { videoId }
  });

  res.json({ liked: true });
});

export const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId).populate("user", "name username");

  if (!video) {
    res.status(404);
    throw new Error("Video not found");
  }

  const comment = await Comment.create({
    video: videoId,
    user: req.user._id,
    text: req.body.text
  });

  await Video.findByIdAndUpdate(videoId, { $inc: { commentsCount: 1 } });
  await createNotification({
    userId: video.user._id,
    actorId: req.user._id,
    type: "comment",
    message: `${req.user.username} commented on your reel`,
    metadata: { videoId }
  });

  const populated = await comment.populate("user", "name username avatarUrl");
  res.status(201).json({ comment: populated });
});

export const getComments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query.page, req.query.limit);
  const query = { video: req.params.videoId };

  const [comments, total] = await Promise.all([
    Comment.find(query).populate("user", "name username avatarUrl").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Comment.countDocuments(query)
  ]);

  res.json(createPaginatedResponse({ docs: comments, total, page, limit }));
});

export const shareVideo = asyncHandler(async (req, res) => {
  const video = await Video.findByIdAndUpdate(
    req.params.videoId,
    { $inc: { sharesCount: 1 } },
    { new: true }
  ).populate("user", "name username");

  if (!video) {
    res.status(404);
    throw new Error("Video not found");
  }

  await createNotification({
    userId: video.user._id,
    actorId: req.user._id,
    type: "share",
    message: `${req.user.username} shared your reel`,
    metadata: { videoId: video._id }
  });

  res.json({ sharesCount: video.sharesCount });
});

export const reportVideo = asyncHandler(async (req, res) => {
  const report = await Report.create({
    video: req.params.videoId,
    reportedBy: req.user._id,
    reason: req.body.reason
  });

  await Video.findByIdAndUpdate(req.params.videoId, { status: "flagged" });
  res.status(201).json({ report });
});
