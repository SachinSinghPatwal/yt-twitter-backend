import mongoose, {isValidObjectId} from "mongoose";
import {Video} from "../models/video.model.js";
import {User} from "../models/user.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {page = 1, limit = 10, query, sortBy, sortType, userId} = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const {title, description} = req.body;

  const {_id: owner} = req.user;
  if (!owner) {
    throw new ApiError(400, "unauthorized to upload the file login first");
  }

  if (!(title || description)) {
    throw new ApiError(400, "title and description field is required");
  }
  const videoFileLocalPath = req.files.videoFile[0].path;
  const thumbnailLocalPath = req.files.thumbnail[0].path;

  const videoFileObject = await uploadOnCloudinary(
    videoFileLocalPath,
    "videos/longVideos",
    "video"
  );
  const thumbnailObject = await uploadOnCloudinary(
    thumbnailLocalPath,
    "videos/thumbnails"
  );

  if (!(thumbnailObject && videoFileObject)) {
    throw new ApiError(
      500,
      "cannot fetched proper data from cloudinary after uploading thumbnail or video"
    );
  }
  let {duration, url: videoFile} = videoFileObject;
  const {url: thumbnail} = thumbnailObject;
  duration = (duration / 60).toFixed(2);

  const video = await Video.create({
    owner,
    videoFile,
    thumbnail,
    title,
    description,
    duration,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "data fetched Successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const {videoId} = req.params;
  if (!videoId) {
    throw new ApiError(400, "invalid videoId");
  }
  const video = await Video.findById(videoId).populate(
    "owner",
    "username createdAt"
  );
  if (!video) {
    throw new ApiError(500, "video with same id was not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, video, "video found successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const {videoId} = req.params;
  //TODO: update video details like title, description, thumbnail
});
const deleteVideo = asyncHandler(async (req, res) => {
  const {videoId} = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const {videoId} = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
