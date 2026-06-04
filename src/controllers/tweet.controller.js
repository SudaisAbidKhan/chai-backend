import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet

  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is missing");
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user?._id,
  });

  return res.status(201).json(new ApiResponse(201, tweet, "Tweet created"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(400, "Unauthorized access");
  }

  //   const tweets = await User.aggregate([
  //     {
  //       $match: {
  //         _id: userId,
  //       },
  //     },
  //     {
  //         $lookup: {
  //             from: "tweets",
  //             foreignField: "owner",
  //             localField: "_id",
  //             as: "tweets"
  //         }
  //     },
  //     {
  //         $project: {
  //             username: 1,
  //             fullName: 1,
  //             avatar: 1,
  //             tweets: 1
  //         }
  //     }
  //   ]);

  const tweets = await Tweet.find({ owner: userId });

  if (!tweets) {
    throw new ApiError(400, "no tweets from this user");
  }

  return res.status(200).json(new ApiResponse(200, tweets, "All User tweets"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet

  const { content } = req.body;
  const { tweetId } = req.params;

  if (!content) {
    throw new ApiError(400, "Content is missing");
  }

  if (!tweetId) {
    throw new ApiError(400, "Content is not available");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    { $set: { content: content } },
    { new: true }
  );

  if (!updatedTweet) {
    throw new ApiError(400, "Something went wrong while updating the tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet Updated Successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet

  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "Content is not available");
  }

  await Tweet.findByIdAndDelete(tweetId)
 
  return res
    .status(200)
    .json(new ApiResponse(200, "Tweet deleted Successfully"));

});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
