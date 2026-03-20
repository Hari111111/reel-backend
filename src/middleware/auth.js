import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

export const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Not authorized");
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, env.jwtSecret);
  const user = await User.findById(decoded.id).select("-password");

  if (!user || user.isBlocked) {
    res.status(401);
    throw new Error("Account unavailable");
  }

  req.user = user;
  next();
});

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    res.status(403);
    throw new Error("Admin only");
  }

  next();
};
