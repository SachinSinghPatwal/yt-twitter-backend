import mongoose, {isValidObjectId} from "mongoose";
import {Video} from "../models/video.model.js";
import {User} from "../models/user.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {deleteFile} from "../utils/DeleteFileFromCloudinary.js";

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

  const videoForDb = await Video.create({
    owner,
    videoFile,
    thumbnail,
    title,
    description,
    duration,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, videoForDb, "data fetched Successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const {videoId} = req.params;
  if (!videoId) {
    throw new ApiError(400, "invalid videoId");
  }
  const video = await Video.findById(videoId).populate(
    "owner",
    "username createdAt avatar username"
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
  const {title, description} = req.body;
  if ([title, description].some((each) => each.trim() == "")) {
    throw new ApiError(400, "all fields are required ");
  }
  const thumbnailLocalPath = req.file?.path;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnail file is required");
  }

  const ownerId = await Video.findById(videoId, {owner: 1});
  if (!ownerId.owner.toString() === req.user._id.toString()) {
    throw new ApiError(410, "you are unAuthorized only the owner can update");
  }
  const oldThumbnail = await Video.findById(videoId);

  if (!oldThumbnail) {
    throw new ApiError(400, "video Id was not found");
  }

  const deletedThumbnail = await deleteFile(oldThumbnail.thumbnail);

  if (deletedThumbnail.result == "not found") {
    throw new ApiError(
      400,
      "something went wrong thumbnail is not delete from cloudinary"
    );
  }
  const thumbnail = await uploadOnCloudinary(
    thumbnailLocalPath,
    "videos/thumbnails"
  );

  if (!thumbnail) throw new ApiError(400, "error thumbnail was not uploaded");
  let video;
  video = await Video.findByIdAndUpdate(videoId, {
    $set: {
      title: title,
      description: description,
      thumbnail: thumbnail?.url,
    },
  });
  return res
    .status(200)
    .json(new ApiResponse(200, video, "details updated Successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const {videoId} = req.params;
  if (!videoId) {
    throw new ApiError(400, "value is empty");
  }
  const ownerId = await Video.findById(videoId, {owner: 1});
  if (!ownerId.owner.toString() === req.user._id.toString()) {
    throw new ApiError(410, "you are unAuthorized , only the owner can delete");
  }
  const videoDeleted = await Video.findById(videoId);
  if (!videoDeleted) {
    throw new ApiError(
      500,
      "something went wrong while deleting entry from database"
    );
  }
  const deleteFromCloudinary = deleteFile(videoDeleted.videoFile);
  if (!deleteFromCloudinary) {
    throw new ApiError(500, "VideoFile was not deleted from Cloudinary");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, videoDeleted, "Video deleted Successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const {videoId} = req.params;
  const ownerId = await Video.findById(videoId, {owner: 1});
  if (!ownerId.owner.toString() === req.user._id.toString()) {
    throw new ApiError(410, "you are unAuthorized only the owner can update");
  }
  const publishedStatus = await Video.findById(videoId);
  if (publishedStatus == undefined || publishedStatus == null) {
    throw new ApiError(
      500,
      "something went wrong cant fetch previous video data"
    );
  }
  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !publishedStatus.isPublished,
      },
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, video, "video visibility changed Successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
