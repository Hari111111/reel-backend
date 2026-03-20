import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    video: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true, index: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ["open", "reviewed", "dismissed"], default: "open" }
  },
  { timestamps: true }
);

export const Report = mongoose.model("Report", reportSchema);
