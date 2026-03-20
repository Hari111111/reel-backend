import { Follow } from "../models/Follow.js";
import { Like } from "../models/Like.js";
import { Video } from "../models/Video.js";

const scoreVideo = ({ video, followingIds, likedIds }) => {
  const ageHours = (Date.now() - new Date(video.createdAt).getTime()) / 36e5;
  const recencyScore = Math.max(0, 48 - ageHours);
  const followingBoost = followingIds.has(String(video.user._id)) ? 40 : 0;
  const likedBoost = likedIds.has(String(video._id)) ? -100 : 0;
  const engagement = video.likesCount * 3 + video.commentsCount * 4 + video.sharesCount * 5 + video.viewsCount;

  return recencyScore + followingBoost + engagement * 0.05 + likedBoost;
};

export const getRankedFeed = async ({ userId, page, limit, skip }) => {
  const [follows, likes, videos, total] = await Promise.all([
    Follow.find({ follower: userId }).select("following"),
    Like.find({ user: userId }).select("video"),
    Video.find({ status: "active" })
      .populate("user", "name username avatarUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit * 3),
    Video.countDocuments({ status: "active" })
  ]);

  const followingIds = new Set(follows.map((follow) => String(follow.following)));
  const likedIds = new Set(likes.map((like) => String(like.video)));

  const ranked = videos
    .map((video) => ({ video, score: scoreVideo({ video, followingIds, likedIds }) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ video }) => video);

  return {
    docs: ranked,
    total,
    page,
    limit
  };
};
