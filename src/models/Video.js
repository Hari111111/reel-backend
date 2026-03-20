import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    caption: { type: String, default: "", maxlength: 300 },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, default: "" },
    duration: { type: Number, default: 0 },
    tags: [{ type: String }],
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "flagged", "removed"], default: "active" }
  },
  { timestamps: true }
);

videoSchema.index({ createdAt: -1 });
videoSchema.index({ caption: "text", tags: "text" });

export const Video = mongoose.model("Video", videoSchema);
