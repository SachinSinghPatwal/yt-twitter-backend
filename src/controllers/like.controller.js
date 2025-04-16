import {Like} from "../models/like.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {Video} from "../models/video.model.js";
import mongoose from "mongoose";

const toggleVideoLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on video
  const {videoId: video} = req.params;
  const {_id: likedBy} = req.user;
  let status;
  const videoExist = await Video.findById(video);
  if (!videoExist) throw new ApiError(400, "video does not exist");
  const existedVideoLikedStatus = await Like.findOne({
    video,
    likedBy,
  });
  if (existedVideoLikedStatus) {
    await Like.deleteOne({
      _id: existedVideoLikedStatus._id,
    });
    status = {videosLikedStatus: false};
  } else {
    await Like.create({video, likedBy});
    status = {videosLikedStatus: true};
  }
  return res
    .status(200)
    .json(new ApiResponse(200, status, "video status fetched successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on comment
  const {commentId: comment} = req.params;
  const {_id: likedBy} = req.user;
  let status;
  const commentExist = await Video.findById(comment);
  if (!commentExist) throw new ApiError(400, "comment does not exist");
  const existedCommentLikedStatus = await Like.findOne({
    comment,
    likedBy,
  });
  if (existedCommentLikedStatus) {
    await Like.deleteOne({
      _id: existedCommentLikedStatus._id,
    });
    status = {commentLikedStatus: false};
  } else {
    await Like.create({comment, likedBy});
    status = {commentLikedStatus: true};
  }
  return res
    .status(200)
    .json(new ApiResponse(200, status, "comment status fetched successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on tweet
  const {tweetId: tweet} = req.params;
  const {_id: likedBy} = req.user;
  let status;
  const tweetExist = await Video.findById(tweet);
  if (!tweetExist) throw new ApiError(400, "tweet does not exist");
  const existedTweetLikedStatus = await Like.findOne({
    tweet,
    likedBy,
  });
  if (existedTweetLikedStatus) {
    await Like.deleteOne({
      _id: existedTweetLikedStatus._id,
    });
    status = {tweetLikedStatus: false};
  } else {
    await Like.create({tweet, likedBy});
    status = {tweetLikedStatus: true};
  }
  return res
    .status(200)
    .json(new ApiResponse(200, status, "tweet status fetched successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos

  const videos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
        video: {$ne: null},
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
      },
    },
    {
      $unwind: "$video",
    },
    {
      $lookup: {
        from: "users",
        localField: "video.owner",
        foreignField: "_id",
        as: "video.owner",
      },
    },
    {
      $unwind: "$video.owner",
    },
    {
      $project: {
        _id: 0,
        videoFile: "$video.videoFile",
        thumbnail: "$video.thumbnail",
        title: "$video.title",
        duration: "$video.duration",
        views: "$video.views",
        isPublished: "$video.isPublished",
        createdAt: "$video.createdAt",
        username: "$owner.username",
      },
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, videos, "videos fetched successfully"));
});

export {toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos};
