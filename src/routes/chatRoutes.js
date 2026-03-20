import express from "express";
import asyncHandler from "express-async-handler";
import ChatMessage from "../models/ChatMessage.js";
import { User } from "../models/User.js";

const router = express.Router();

// Send message
router.post(
  "/messages",
  asyncHandler(async (req, res) => {
    const { receiverId, text } = req.body;
    const senderId = req.user.id;

    const message = new ChatMessage({
      sender: senderId,
      receiver: receiverId,
      text,
      read: false,
    });

    await message.save();
    res.status(201).json(message);
  })
);

// Get chat history
router.get(
  "/history/:userId",
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const messages = await ChatMessage.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    })
    .sort({ timestamp: -1 })
    .limit(50)
    .populate('sender', 'name username avatarUrl')
    .populate('receiver', 'name username avatarUrl');

    res.json(messages.reverse());
  })
);

// Mark messages as read
router.post(
  "/mark-read",
  asyncHandler(async (req, res) => {
    const { senderId } = req.body;
    const receiverId = req.user.id;

    await ChatMessage.updateMany(
      { sender: senderId, receiver: receiverId, read: false },
      { read: true }
    );

    res.json({ success: true });
  })
);

// Delete message
router.delete(
  "/messages/:messageId",
  asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await ChatMessage.findOne({
      _id: messageId,
      sender: userId,
    });

    if (!message) {
      res.status(404);
      throw new Error("Message not found or not authorized");
    }

    await message.deleteOne();
    res.json({ success: true });
  })
);

// Block user
router.post(
  "/block",
  asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const currentUserId = req.user.id;

    const user = await User.findById(currentUserId);
    if (!user.blockedUsers.includes(userId)) {
      user.blockedUsers.push(userId);
      await user.save();
    }

    res.json({ success: true });
  })
);

// Unblock user
router.post(
  "/unblock",
  asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const currentUserId = req.user.id;

    const user = await User.findById(currentUserId);
    user.blockedUsers = user.blockedUsers.filter(id => id !== userId);
    await user.save();

    res.json({ success: true });
  })
);

export default router;
