import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    video: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, maxlength: 300 }
  },
  { timestamps: true }
);

export const Comment = mongoose.model("Comment", commentSchema);
