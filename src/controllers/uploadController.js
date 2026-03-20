import asyncHandler from "express-async-handler";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import { User } from "../models/User.js";

const storage = multer.memoryStorage();
const videoFieldNames = new Set(["video", "file", "media", "asset"]);

const isVideoLikeFile = (file) => {
  if (!file) {
    return false;
  }

  if (file.mimetype?.startsWith("video/")) {
    return true;
  }

  return /\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(file.originalname || "");
};

const imageUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
      return;
    }

    cb(new Error("Only image files are allowed"), false);
  },
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const videoUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (isVideoLikeFile(file)) {
      cb(null, true);
      return;
    }

    cb(new Error("Only video files are allowed"), false);
  },
  limits: {
    fileSize: 100 * 1024 * 1024
  }
});

const normalizeUploadedVideo = (req, res, next) => {
  const files = Array.isArray(req.files) ? req.files : [];
  const preferredFile =
    files.find((file) => videoFieldNames.has(file.fieldname) && isVideoLikeFile(file)) ||
    files.find(isVideoLikeFile);

  if (preferredFile) {
    req.file = preferredFile;
  }

  next();
};

const ensureCloudinaryConfigured = () => {
  const { cloud_name, api_key, api_secret } = cloudinary.config();

  if (!cloud_name || !api_key || !api_secret) {
    throw new Error("Cloudinary is not configured on the server");
  }
};

const uploadBufferToCloudinary = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result);
    });

    stream.end(buffer);
  });

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded");
  }

  ensureCloudinaryConfigured();

  const existingUser = await User.findById(req.user._id).select("cloudinaryPublicId");
  if (!existingUser) {
    res.status(404);
    throw new Error("User not found");
  }

  const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
    resource_type: "image",
    folder: "reel-app/avatars",
    public_id: `avatar-${req.user._id}-${Date.now()}`,
    transformation: [
      { width: 400, height: 400, crop: "fill" },
      { quality: "auto" },
      { fetch_format: "auto" }
    ]
  });

  if (existingUser.cloudinaryPublicId) {
    await cloudinary.uploader.destroy(existingUser.cloudinaryPublicId, {
      invalidate: true,
      resource_type: "image"
    }).catch(() => {});
  }

  await User.findByIdAndUpdate(req.user._id, {
    avatarUrl: uploadResult.secure_url,
    cloudinaryPublicId: uploadResult.public_id
  });

  res.json({
    url: uploadResult.secure_url,
    publicId: uploadResult.public_id,
    uploaded: true,
    message: "Image uploaded to Cloudinary successfully."
  });
});

export const uploadPostImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No image uploaded");
  }

  ensureCloudinaryConfigured();

  const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
    resource_type: "image",
    folder: `reel-app/posts/${req.user._id}`,
    public_id: `post-${req.user._id}-${Date.now()}`,
    transformation: [
      { width: 1200, height: 1500, crop: "limit" },
      { quality: "auto" },
      { fetch_format: "auto" }
    ]
  });

  res.json({
    imageUrl: uploadResult.secure_url,
    imagePublicId: uploadResult.public_id,
    uploaded: true
  });
});

export const uploadVideo = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No video uploaded");
  }

  ensureCloudinaryConfigured();

  const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
    resource_type: "video",
    folder: `reel-app/videos/${req.user._id}`,
    public_id: `reel-${req.user._id}-${Date.now()}`,
    overwrite: false
  });

  const thumbnailUrl = cloudinary.url(uploadResult.public_id, {
    resource_type: "video",
    format: "jpg",
    secure: true,
    transformation: [
      { width: 720, height: 1280, crop: "fill" },
      { quality: "auto" }
    ]
  });

  res.json({
    videoUrl: uploadResult.secure_url,
    videoPublicId: uploadResult.public_id,
    thumbnailUrl,
    thumbnailPublicId: uploadResult.public_id,
    duration: Number(uploadResult.duration || 0),
    bytes: uploadResult.bytes
  });
});

export const uploadImageMiddleware = imageUpload.single("image");
export const uploadVideoMiddleware = [videoUpload.any(), normalizeUploadedVideo];
