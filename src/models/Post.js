import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    caption: { type: String, default: "", maxlength: 500 },
    imageUrl: { type: String, required: true },
    imagePublicId: { type: String, default: "" },
    location: { type: String, default: "", maxlength: 120 },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "removed"], default: "active" }
  },
  { timestamps: true }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ caption: "text", location: "text" });

export const Post = mongoose.model("Post", postSchema);
