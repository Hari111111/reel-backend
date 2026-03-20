import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    default: "",
    trim: true,
  },
  messageType: {
    type: String,
    enum: ["text", "image", "video", "file", "call"],
    default: "text",
  },
  attachmentUrl: {
    type: String,
    default: "",
  },
  attachmentPublicId: {
    type: String,
    default: "",
  },
  attachmentName: {
    type: String,
    default: "",
  },
  attachmentMimeType: {
    type: String,
    default: "",
  },
  attachmentSize: {
    type: Number,
    default: 0,
  },
  callType: {
    type: String,
    enum: ["audio", "video", ""],
    default: "",
  },
  read: {
    type: Boolean,
    default: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

chatMessageSchema.index({ sender: 1, receiver: 1 });
chatMessageSchema.index({ timestamp: -1 });

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

export default ChatMessage;
