import mongoose from "mongoose";
import {Video} from "../models/video.model.js";
import {Subscription} from "../models/subscription.model.js";
import {Like} from "../models/like.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const stats = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        foreignField: "owner",
        localField: "_id",
        as: "videoStats",
      },
    },
    {
      $lookup: {
        from: "likes",
        foreignField: "likedBy",
        localField: "_id",
        as: "likeStats",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToTotalCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
            then: true,
            else: false,
          },
        },
        videosCount: {
          $size: "$videoStats",
        },
        likeCount: {
          $size: "$likeStats",
        },
      },
    },
    {
      $project: {
        username: 1,
        fullname: 1,
        subscribersCount: 1,
        channelsSubscribedToTotalCount: 1,
        videosCount: 1,
        likeCount: 1,
        totalViews: {
          $reduce: {
            input: {$ifNull: ["$videoStats", []]},
            initialValue: 0,
            in: {$add: ["$$value", "$$this.views"]},
          },
        },
      },
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, stats[0], "stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $project: {
        owner: 1,
        videoFile: 1,
        thumbnail: 1,
        duration: 1,
        view: 1,
        createdAt: 1,
        title: 1,
      },
    },
  ]);
  if (videos == null) {
    throw new ApiError(
      500,
      "something went wrong while getting channel videos."
    );
  }
  return res
    .status(200)
    .json(new ApiResponse(200, videos, "videos fetched successfully"));
});

export {getChannelStats, getChannelVideos};
