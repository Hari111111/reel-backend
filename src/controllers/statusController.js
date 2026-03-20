import asyncHandler from "express-async-handler";
import { Status } from "../models/Status.js";
import { buildPagination, createPaginatedResponse } from "../utils/apiFeatures.js";

const STATUS_LIFETIME_MS = 24 * 60 * 60 * 1000;

const ensureActiveStatuses = async () => {
  await Status.updateMany(
    { status: "active", expiresAt: { $lte: new Date() } },
    { $set: { status: "expired" } }
  );
};

export const createStatus = asyncHandler(async (req, res) => {
  const text = String(req.body.text || "").trim();
  const color = String(req.body.color || "#f97316").trim() || "#f97316";

  if (!text) {
    res.status(400);
    throw new Error("Status text is required");
  }

  await ensureActiveStatuses();

  await Status.updateMany(
    { user: req.user._id, status: "active" },
    { $set: { status: "expired", expiresAt: new Date() } }
  );

  const createdAt = new Date();
  const status = await Status.create({
    user: req.user._id,
    text,
    color,
    expiresAt: new Date(createdAt.getTime() + STATUS_LIFETIME_MS),
    createdAt,
    updatedAt: createdAt
  });

  const populated = await status.populate("user", "name username avatarUrl");
  res.status(201).json({ status: populated });
});

export const getStatusesFeed = asyncHandler(async (req, res) => {
  await ensureActiveStatuses();
  const { page, limit, skip } = buildPagination(req.query.page, req.query.limit);
  const query = { status: "active", expiresAt: { $gt: new Date() } };

  const [statuses, total] = await Promise.all([
    Status.find(query).populate("user", "name username avatarUrl").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Status.countDocuments(query)
  ]);

  res.json(createPaginatedResponse({ docs: statuses, total, page, limit }));
});

export const getUserStatuses = asyncHandler(async (req, res) => {
  await ensureActiveStatuses();
  const { page, limit, skip } = buildPagination(req.query.page, req.query.limit);
  const query = { status: "active", expiresAt: { $gt: new Date() }, user: req.params.userId };

  const [statuses, total] = await Promise.all([
    Status.find(query).populate("user", "name username avatarUrl").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Status.countDocuments(query)
  ]);

  res.json(createPaginatedResponse({ docs: statuses, total, page, limit }));
});
