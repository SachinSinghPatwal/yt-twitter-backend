import mongoose, {isValidObjectId} from "mongoose";
import {Playlist} from "../models/playlist.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {Video} from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  //TODO: create playlist
  const {name, description} = req.body;
  const {_id: owner} = req.user;
  if (!(name || description)) {
    throw new ApiError(402, "all fields are required");
  }
  const exist = await Playlist.findOne({
    name,
  });
  if (exist) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, exist, "playlist with the same already exist")
      );
  }
  const playlist = await Playlist.create({
    name,
    description,
    owner,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist created Successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  //TODO: get user playlists
  const {userId} = req.params;
  if (!isValidObjectId(userId)) {
    throw new ApiError(407, "Invalid userId does not cast into mongoDb _id");
  }
  const usersPlaylist = await Playlist.aggregate([
    {
      $facet: {
        TotalNumberOfPlaylist: [
          {
            $count: "count",
          },
        ],
        usersPlaylists: [
          {
            $match: {
              owner: new mongoose.Types.ObjectId(userId),
            },
          },
        ],
      },
    },
  ]);
  if (!usersPlaylist) {
    return res
      .status(205)
      .json(
        new ApiResponse(
          205,
          usersPlaylist,
          "playlist with given owner does not exist"
        )
      );
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, usersPlaylist, `playlists fetched Successfully`)
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  //TODO: get playlist by id
  const {playlistId} = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(
      407,
      "Invalid playlistId does not cast into mongoDb _id"
    );
  }
  const playlist = await Playlist.findOne({
    _id: new mongoose.Types.ObjectId(playlistId),
  });
  if (!playlist) {
    return res
      .status(404)
      .json(new ApiResponse(404, "", "playlist with same name does exist"));
  }
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist fetched Successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const {playlistId, videoId} = req.params;
  if (!(isValidObjectId(playlistId) && isValidObjectId(videoId))) {
    throw new ApiError(
      402,
      "Invalid id's either from playlist or video id's cannot cast into mongoDb _id"
    );
  }
  const videoExists = await Video.exists({_id: videoId});
  if (!videoExists) {
    return res
      .status(404)
      .json(new ApiResponse(404, "Video not found or does not exist"));
  }
  const playlistExists = await Playlist.exists({_id: playlistId});
  if (!playlistExists) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Playlist not found or does not exist"));
  }
  const videoInPlaylistExists = await Playlist.exists({
    "video._id": new mongoose.Types.ObjectId(videoId),
  });
  if (videoInPlaylistExists) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "video already exist"));
  }
  const videoAddedOnPlaylist = await Playlist.updateOne(
    {_id: new mongoose.Types.ObjectId(playlistId)},
    {
      $addToSet: {
        videos: new mongoose.Types.ObjectId(videoId),
      },
    }
  );
  if (videoAddedOnPlaylist.modifiedCount == 0) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "video already exist "));
  }
  const videoOnPLaylist = await Playlist.aggregate([
    {
      $match: {_id: new mongoose.Types.ObjectId(playlistId)},
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        owner: 1,
        videos: {
          $map: {
            input: "$videos",
            as: "video",
            in: {
              _id: "$$video._id",
              title: "$$video.title",
              thumbnail: "$$video.thumbnail",
              videoFile: "$$video.videoFile",
              views: "$$video.view",
              videoOwner: "$$video.owner",
              createdAt: "$$video.createdAt",
              duration: "$$video.duration",
            },
          },
        },
      },
    },
  ]);
  if (!videoOnPLaylist) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          404,
          null,
          "video was not added to playlist , something went wrong"
        )
      );
  }
  return res
    .status(200)
    .json(new ApiResponse(200, videoOnPLaylist, "video Added Successfully"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const {playlistId, videoId} = req.params;
  // TODO: remove video from playlist
  if (!(isValidObjectId(playlistId) && isValidObjectId(videoId))) {
    throw new ApiError(
      402,
      "Invalid id's either from playlist or video id's cannot cast into mongoDb _id"
    );
  }
  const videoExists = await Video.exists({_id: videoId});
  if (!videoExists) {
    return res
      .status(404)
      .json(new ApiResponse(404, "Video not found or does not exist"));
  }
  const playlistExists = await Playlist.exists({
    _id: playlistId,
  });
  if (!playlistExists) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Playlist not found or does not exist"));
  }
  const videoInPlaylistExists = await Playlist.exists({
    "videos._id": mongoose.Types.ObjectId(videoId),
  });
  if (!videoInPlaylistExists) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          404,
          null,
          "video not found in playlist or does not exist"
        )
      );
  }
  const videoRemovedFromPlaylist = await Playlist.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(videoId),
      },
    },
  ]);
  if (!videoRemovedFromPlaylist) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          404,
          null,
          "video was not deleted from playlist , something went wrong"
        )
      );
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, videoAddedOnPlaylist, "video Added Successfully")
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  // TODO: delete playlist
  const {playlistId} = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(402, "Invalid playlistId cannot cast into mongoDb _id");
  }
  const playlist = await Playlist.findByIdAndDelete(playlistId);
  if (!playlist) {
    return res
      .status(200)
      .json(new ApiResponse(200, playlist, "playlist does not exist"));
  }
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist deleted Successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const {playlistId} = req.params;
  const {name, description} = req.body;
  //TODO: update playlist
  if (!name && !description) {
    throw new ApiError(
      402,
      "at least ome field is required fields are required"
    );
  }
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(
      404,
      "Invalid playlistId does not cast into mongoDb _id"
    );
  }
  const existingPlaylist = await Playlist.findById(playlistId);
  if (!existingPlaylist) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "playlist does not exist"));
  }
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name: name || existingPlaylist.name,
        description: description || existingPlaylist.description,
      },
    },
    {
      new: true,
    }
  );
  if (!updatedPlaylist) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedPlaylist,
          "playlist was not found or does not exist"
        )
      );
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "playlist updated Successfully")
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
