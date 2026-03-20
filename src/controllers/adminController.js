import asyncHandler from "express-async-handler";
import { Report } from "../models/Report.js";
import { User } from "../models/User.js";
import { Video } from "../models/Video.js";
import { buildPagination, createPaginatedResponse } from "../utils/apiFeatures.js";

export const getStats = asyncHandler(async (req, res) => {
  const [users, videos, reports, engagement] = await Promise.all([
    User.countDocuments(),
    Video.countDocuments(),
    Report.countDocuments({ status: "open" }),
    Video.aggregate([
      {
        $group: {
          _id: null,
          likes: { $sum: "$likesCount" },
          comments: { $sum: "$commentsCount" },
          shares: { $sum: "$sharesCount" }
        }
      }
    ])
  ]);

  res.json({
    stats: {
      users,
      videos,
      openReports: reports,
      engagement: engagement[0] || { likes: 0, comments: 0, shares: 0 }
    }
  });
});

export const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query.page, req.query.limit);
  const search = req.query.q?.trim();
  const query = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ]
      }
    : {};

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query)
  ]);

  res.json(createPaginatedResponse({ docs: users, total, page, limit }));
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.userId,
    { isBlocked: req.body.isBlocked },
    { new: true }
  );

  res.json({ user });
});

export const deleteUser = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.params.userId);
  res.status(204).send();
});

export const getVideos = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query.page, req.query.limit);
  const status = req.query.status;
  const query = status ? { status } : {};

  const [videos, total] = await Promise.all([
    Video.find(query).populate("user", "name username").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Video.countDocuments(query)
  ]);

  res.json(createPaginatedResponse({ docs: videos, total, page, limit }));
});

export const deleteVideo = asyncHandler(async (req, res) => {
  await Video.findByIdAndDelete(req.params.videoId);
  res.status(204).send();
});

export const moderateVideo = asyncHandler(async (req, res) => {
  const video = await Video.findByIdAndUpdate(
    req.params.videoId,
    { status: req.body.status },
    { new: true }
  );

  res.json({ video });
});

export const getReports = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query.page, req.query.limit);
  const status = req.query.status;
  const query = status ? { status } : {};

  const [reports, total] = await Promise.all([
    Report.find(query)
      .populate("video", "caption videoUrl thumbnailUrl status")
      .populate("reportedBy", "name username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Report.countDocuments(query)
  ]);

  res.json(createPaginatedResponse({ docs: reports, total, page, limit }));
});

export const updateReport = asyncHandler(async (req, res) => {
  const report = await Report.findByIdAndUpdate(
    req.params.reportId,
    { status: req.body.status },
    { new: true }
  );

  res.json({ report });
});
