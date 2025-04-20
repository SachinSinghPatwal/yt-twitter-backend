import mongoose, {isValidObjectId} from "mongoose";
import {Video} from "../models/video.model.js";
import {User} from "../models/user.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {deleteFile} from "../utils/DeleteFileFromCloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  //TODO: get all videos based on query, sort, pagination
  const {page = 1, limit = 10, sortBy = -1, search = "", sortType} = req.query;
  try {
    const matchStage = {
      isPublished: true,
      title: {$regex: search, $options: "i"},
    };
    const sortedVideos = Video.aggregate([
      {$match: matchStage},
      {$sort: {[sortType]: parseInt(sortBy)}},
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      {
        $unwind: "$owner",
      },
      {
        $project: {
          videoFile: 1,
          thumbnail: 1,
          title: 1,
          duration: 1,
          views: 1,
          channel: "$owner.username",
          channelProfile: "$owner.avatar",
          createdAt: 1,
        },
      },
    ]);
    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
    };
    const paginatedAndSortedVideos = await Video.aggregatePaginate(
      sortedVideos,
      pagination
    );
    if (!paginatedAndSortedVideos) {
      return res.status(404).json(new ApiResponse(404, [], "No video found"));
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          paginatedAndSortedVideos,
          "limited Video are fetched Successfully"
        )
      );
  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(500, error.message, "Something went wrong"));
  }
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
  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $unwind: "$owner",
    },
    {
      $project: {
        username: "$owner.username",
        avatar: "$owner.avatar",
        videoId: 1,
        thumbnail: 1,
        title: 1,
        duration: 1,
        duration: 1,
        isPublished: 1,
        createdAt: 1,
      },
    },
  ]);
  if (!video) {
    throw new ApiError(500, "video with same id was not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "video found successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const {videoId} = req.params;
  //TODO: update video details like title, description, thumbnail
  const {title, description} = req.body;
  if (!videoId) {
    throw new ApiError(404, "Empty videoId , Some value is required");
  }
  if ([title, description].some((each) => each.trim() == "")) {
    throw new ApiError(400, "all fields are required ");
  }
  const thumbnailLocalPath = req.file?.path;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnail file is required");
  }

  const ownerId = await Video.findById(videoId);

  if (!ownerId) {
    throw new ApiError(404, "invalid videoId");
  }

  if (!ownerId.owner.toString() === req.user._id.toString()) {
    throw new ApiError(
      410,
      "you are unAuthorized only the owner can update the thumbnail"
    );
  }
  const oldThumbnail = await Video.findById(videoId);

  if (!oldThumbnail) {
    throw new ApiError(400, "Invalid video id as no result found matching");
  }
  const deletedThumbnail = await deleteFile(
    oldThumbnail.thumbnail,
    "videos/thumbnails"
  );

  if (deletedThumbnail.result == "not found") {
    throw new ApiError(
      404,
      "unable to find and delete your previous Video from cloudinary"
    );
  }
  const thumbnail = await uploadOnCloudinary(
    thumbnailLocalPath,
    "videos/thumbnails"
  );

  if (!thumbnail) throw new ApiError(400, "error thumbnail was not uploaded");
  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title: title,
        description: description,
        thumbnail: thumbnail?.url,
      },
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, video, "details updated Successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const {videoId} = req.params;
  if (!videoId) {
    throw new ApiError(400, "value is empty");
  }
  const ownerId = await Video.findById(videoId);
  if (!ownerId.owner.toString() === req.user._id.toString()) {
    throw new ApiError(410, "you are unAuthorized , only the owner can delete");
  }
  const videoDeleted = await Video.findByIdAndDelete(videoId);
  if (!videoDeleted) {
    throw new ApiError(
      500,
      "something went wrong while deleting entry from database"
    );
  }
  const deleteVideoFromCloudinary = deleteFile(
    videoDeleted.videoFile,
    "videos/longVideos",
    "video"
  );
  const deleteThumbnailFromCloudinary = deleteFile(
    videoDeleted.thumbnail,
    "videos/thumbnails"
  );
  if (
    (deleteVideoFromCloudinary && deleteThumbnailFromCloudinary) == "not found"
  ) {
    throw new ApiError(
      404,
      "unable to find and delete your Video from cloudinary"
    );
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
