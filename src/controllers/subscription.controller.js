import mongoose, {isValidObjectId} from "mongoose";
import {User} from "../models/user.model.js";
import {Subscription} from "../models/subscription.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  // TODO: toggle subscription
  const {channelId: channel} = req.params;
  // const channelStatus = await User.findById(channel);
  // let subscription;
  // let data;
  // if (!channelStatus) throw new ApiError(400, "channel does not exist.");
  // const alreadySubscribedStatus = await Subscription.findOne({
  //   channel,
  // });
  // if (alreadySubscribedStatus) {
  //   console.log("unsubscribe");
  //   subscription = "unsubscribed";
  //   data = await Subscription.findOneAndDelete(channel);
  // } else {
  //   console.log("subscriber");
  //   data = await Subscription.create({channel});
  //   subscription = "subscribed";
  // }
  // return res
  //   .status(200)
  //   .json(
  //     new ApiResponse(200, [data, subscription], "subscribed successfully")
  //   );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  // const {channelId} = req.params;
  // const subscribers = await Subscription.aggregate([
  //   {
  //     $group: {
  //       _id: "channel",
  //       subscriberIdCount: {
  //         sum: 1,
  //       },
  //     },
  //   },
  // ]);
  // console.log(subscribers);
  // if (subscribers.length == 0) {
  //   throw new ApiError(412, "something went wrong maybe the Id was invalid.");
  // }
  // return res
  //   .status(200)
  //   .json(new ApiResponse(200, subscribers, "subscriber fetched successfully"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const {subscriberId} = req.params;
});

export {toggleSubscription, getUserChannelSubscribers, getSubscribedChannels};
