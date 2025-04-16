import mongoose, {isValidObjectId} from "mongoose";
import {Tweet} from "../models/tweet.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const {content} = req.body;
  const {_id: owner} = req.user;
  if (!owner) {
    throw new ApiError(404, "unauthorized to access resource");
  }
  if (!content) {
    throw new ApiError(
      404,
      "Empty content , please provide some value in content"
    );
  }
  const tweet = await Tweet.create({
    content,
    owner,
  });
  if (!tweet) {
    throw new ApiError(500, "Something went wrong while creating your tweet");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created Successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const {userId} = req.params;
  if (!userId) {
    throw new ApiError(404, "Empty user id");
  }
  const tweetsList = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $project: {
        __v: 0,
      },
    },
  ]);
  return res.json(new ApiResponse(200, tweetsList));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const {tweetId} = req.params;
  const {content} = req.body;
  if (!(tweetId && content)) {
    throw new ApiError(404, "Empty Id or content");
  }
  const tweet = await Tweet.findByIdAndUpdate(tweetId, {
    content,
  });
  if (!tweet) {
    throw new ApiError(404, "Invalid tweet id check again");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet updated Successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const {tweetId} = req.params;
  if (!tweetId) {
    throw new ApiError(404, "Empty Id");
  }
  const tweet = await Tweet.findByIdAndDelete(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Invalid tweet id check again");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet deleted Successfully"));
});

export {createTweet, getUserTweets, updateTweet, deleteTweet};
