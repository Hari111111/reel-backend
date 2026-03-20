import { Notification } from "../models/Notification.js";

export const createNotification = async ({ userId, actorId, type, message, metadata = {} }) => {
  if (!userId || String(userId) === String(actorId)) {
    return null;
  }

  return Notification.create({
    user: userId,
    actor: actorId,
    type,
    message,
    metadata
  });
};
