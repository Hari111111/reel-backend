import asyncHandler from "express-async-handler";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { User } from "../models/User.js";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded");
  }

  try {
    const userId = req.user._id;
    const imageBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;

    // Store image locally in database first
    const user = await User.findByIdAndUpdate(
      userId,
      {
        avatarBuffer: imageBuffer,
        avatarMimeType: mimeType,
        avatarUrl: `/api/users/${userId}/avatar`, // Local endpoint
      },
      { new: true }
    );

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // Try to upload to Cloudinary in background (non-blocking)
    uploadToCloudinary(userId, imageBuffer, mimeType).catch(console.error);

    res.json({
      url: `/api/users/${userId}/avatar`, // Local URL
      localUrl: `/api/users/${userId}/avatar`,
      uploaded: true,
      message: "Image stored locally. Cloudinary sync in progress."
    });

  } catch (error) {
    res.status(500);
    throw new Error("Image upload failed");
  }
});

// Background function to upload to Cloudinary
async function uploadToCloudinary(userId, imageBuffer, mimeType) {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      console.log("Cloudinary not configured, skipping upload");
      return;
    }

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          folder: "reel-app/avatars",
          transformation: [
            { width: 200, height: 200, crop: "fill" },
            { quality: "auto" },
            { fetch_format: "auto" }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(imageBuffer);
    });

    // Update user with Cloudinary info
    await User.findByIdAndUpdate(userId, {
      avatarUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
    });

    console.log(`Cloudinary upload successful for user ${userId}`);
  } catch (error) {
    console.error(`Cloudinary upload failed for user ${userId}:`, error);
  }
}

export const uploadMiddleware = upload.single("image");

// Serve local avatar images
export const serveAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select("avatarBuffer avatarMimeType");
  
  if (!user || !user.avatarBuffer) {
    res.status(404);
    throw new Error("Avatar not found");
  }

  res.set({
    "Content-Type": user.avatarMimeType || "image/jpeg",
    "Cache-Control": "public, max-age=86400", // Cache for 1 day
  });

  res.send(user.avatarBuffer);
});
