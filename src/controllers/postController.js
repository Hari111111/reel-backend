import asyncHandler from "express-async-handler";
import { Post } from "../models/Post.js";
import { buildPagination, createPaginatedResponse } from "../utils/apiFeatures.js";

export const createPost = asyncHandler(async (req, res) => {
  const post = await Post.create({
    user: req.user._id,
    caption: req.body.caption,
    imageUrl: req.body.imageUrl,
    imagePublicId: req.body.imagePublicId,
    location: req.body.location || ""
  });

  const populated = await post.populate("user", "name username avatarUrl");
  res.status(201).json({ post: populated });
});

export const getPostsFeed = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query.page, req.query.limit);
  const query = { status: "active" };

  const [posts, total] = await Promise.all([
    Post.find(query).populate("user", "name username avatarUrl").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Post.countDocuments(query)
  ]);

  res.json(createPaginatedResponse({ docs: posts, total, page, limit }));
});

export const getUserPosts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query.page, req.query.limit);
  const query = { status: "active", user: req.params.userId };

  const [posts, total] = await Promise.all([
    Post.find(query).populate("user", "name username avatarUrl").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Post.countDocuments(query)
  ]);

  res.json(createPaginatedResponse({ docs: posts, total, page, limit }));
});
