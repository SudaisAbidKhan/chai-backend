import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteOnCloudinaryThumbnail,
  deleteOnCloudinaryVideoFile,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const pipeline = [
    {
      $match: {
        isPublished: true,
        ...(userId && { owner: new mongoose.Types.ObjectId(userId) }),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    {
      $sort: { [sortBy || "createdAt"]: sortType === "asc" ? 1 : -1 },
    },
  ];

  const videos = await Video.aggregatePaginate(Video.aggregate(pipeline), {
    page,
    limit,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existingVideo = await Video.findOne({ title });
  if (existingVideo) {
    throw new ApiError(400, "Video with this title all ready exists");
  }

  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thunbnail file is required");
  }

  const videoFileLocalPath = req.files?.videoFile[0]?.path;
  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is required");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  const videoFile = await uploadOnCloudinary(videoFileLocalPath);

  if (!thumbnail || !videoFile) {
    throw new ApiError(400, "Thunbnail and video file is required");
  }
  const duration = videoFile.duration / 60;

  const video = await Video.create({
    title,
    description,
    thumbnail: thumbnail.url,
    videoFile: videoFile.url,
    duration,
    owner: req.user?._id,
  });

  if (!video) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, video, "Video Uploaded Successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Not Found");
  }

  return res.status(201).json(new ApiResponse(200, video, "Video Founded"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail

  const existingVideo = await Video.findById(videoId);

  if (!existingVideo) {
    throw new ApiError(400, "Video does not exists");
  }

  const { title, description } = req.body;

  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const thumbnailLocalPath = req.file?.path;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thunbnail file is required");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnail) {
    throw new ApiError(400, "Thunbnail is required");
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title: title,
        description: description,
        thumbnail: thumbnail.url,
      },
    },
    { new: true }
  );

  return res
    .status(201)
    .json(new ApiResponse(200, video, "Video Updated Successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  const existingVideo = await Video.findById(videoId);

  if (!existingVideo) {
    throw new ApiError(400, "Video does not exists");
  }

  const publicIdThumbnail = existingVideo.thumbnail
    .split("/")
    .slice(-1)[0]
    .split(".")[0];

  const publicIdvideo = existingVideo.videoFile
    .split("/")
    .slice(-1)[0]
    .split(".")[0];

  await deleteOnCloudinaryThumbnail(publicIdThumbnail);
  await deleteOnCloudinaryVideoFile(publicIdvideo);
  await Video.findByIdAndDelete(videoId);

  return res
    .status(201)
    .json(new ApiResponse(200, "Video deleted Successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const existingVideo = await Video.findById(videoId);

  if (!existingVideo) {
    throw new ApiError(400, "Video does not exists");
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !existingVideo.isPublished
      },
    },
    { new: true }
  )


  return res
    .status(201)
    .json(new ApiResponse(200, video, "Video Publish status changed"));

});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
