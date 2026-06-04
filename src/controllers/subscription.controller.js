import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { channel } from "diagnostics_channel";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription

  const channel = await Subscription.findOne({ channel: channelId });

  // if (!channel) {
  //   throw new ApiError(400, "Channel Not Found");
  // }

  console.log(channel);
  console.log(channelId);

  const userId = req.user?._id;

  const Unsubscribed = await Subscription.findOneAndDelete({
    subscriber: req.user?._id,
    channel: channelId,
  });

  if (Unsubscribed) {
    return res.status(200).json(new ApiResponse(200, null, "Unsubscribed"));
  }

  const subscribing = await Subscription.create({
    subscriber: userId,
    channel: channelId,
  });

  return res.status(200).json(new ApiResponse(200, subscribing, "Subscribed"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel ID");
  }

  const subscriber = await Subscription.aggregate([
    {
      $match: { channel: new mongoose.Types.ObjectId(channelId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        subscriber: 1,
      },
    },
  ]);


  return res
    .status(200)
    .json(new ApiResponse(200, subscriber, "List of Subscribers"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;


  const subscriber = await Subscription.findOne(
    { subscriber: subscriberId },
    { subscriber: 1, _id: 0 }
  );

  if (!subscriber) {
    throw new ApiError(400, "User not found");
  }

  const channel = await Subscription.aggregate([
    {
      $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        channel: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, channel, "Channel the user is subscirbe to"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
