import mongoose from "mongoose";

const statusSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, required: true, trim: true, maxlength: 220 },
    color: { type: String, default: "#f97316", maxlength: 32 },
    status: { type: String, enum: ["active", "expired", "removed"], default: "active", index: true },
    expiresAt: { type: Date, required: true, index: true }
  },
  { timestamps: true }
);

statusSchema.index({ createdAt: -1 });

export const Status = mongoose.model("Status", statusSchema);
