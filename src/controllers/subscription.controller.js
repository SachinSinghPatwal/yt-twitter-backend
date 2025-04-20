import mongoose, {isValidObjectId} from "mongoose";
import {User} from "../models/user.model.js";
import {Subscription} from "../models/subscription.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  // TODO: toggle subscription
  const {channelId: channel} = req.params;
  const {_id: subscriber} = req.user;
  let message;
  let subscribing = "";
  if (channel.toString() === subscriber.toString()) {
    throw new ApiError(400, "you cannot subscribe yourself");
  }
  try {
    const existingSubscription = await Subscription.findOne({
      channel,
      subscriber,
    });
    if (existingSubscription) {
      await Subscription.findByIdAndDelete({_id: existingSubscription._id});
      message = "unsubscribed";
    } else {
      subscribing = await Subscription.create({
        channel,
        subscriber,
      });
      message = "subscribed";
    }
    return res.status(200).json(new ApiResponse(200, subscribing, message));
  } catch (error) {
    res
      .status(500)
      .json(new ApiResponse(504, error.message, "Something went wrong"));
  }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  // controller to return subscriber list of a channel
  const {subscriberId} = req.params;
  const channelsSubscribing = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $count: "subscribers",
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channelsSubscribing[0],
        "subscribers fetched successfully"
      )
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  // controller to return channel list to which user has subscribed
  const {channelId} = req.params;
  const channelsOfUserChannel = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $count: "channelsSubscribing",
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channelsOfUserChannel[0],
        "channels subscribing fetched successfully"
      )
    );
});

export {toggleSubscription, getUserChannelSubscribers, getSubscribedChannels};
