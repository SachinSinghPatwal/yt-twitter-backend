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
  if (isValidObjectId(userId)) {
    throw new ApiError(407, "Invalid userId does not cast into mongoDb _id");
  }
  const usersPlaylist = await Playlist.aggregate([
    {
      $match: new mongoose.Types.ObjectId(userId),
    },
  ]);
  if (!usersPlaylist) {
    return res
      .status(212)
      .json(
        new ApiResponse(
          212,
          usersPlaylist,
          "playlist with given owner does exist"
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
  if (isValidObjectId(playlistId)) {
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
      .status(212)
      .json(new ApiResponse(212, "", "playlist with same name does exist"));
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
  const playlist = await Playlist.findOne({_id: playlistId});
  const video = await Video.findOne({_id: videoId});
  if (!(playlist && video)) {
    throw new ApiError(
      400,
      "either playlist and video is invalid or does not exist or anymore"
    );
  }
  const videoAddedOnPlaylist = await Playlist.create({
    video: new mongoose.Types.ObjectId(videoId),
  });
  return res
    .status(200)
    .json(
      new ApiResponse(200, videoAddedOnPlaylist, "video Added Successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const {playlistId, videoId} = req.params;
  // TODO: remove video from playlist
});

const deletePlaylist = asyncHandler(async (req, res) => {
  // TODO: delete playlist
  const {playlistId} = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(402, "Invalid playlistId cannot cast into mongoDb _id");
  }
  const playlist = await Playlist.findByIdAndDelete(playlistId);
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist deleted Successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const {playlistId} = req.params;
  const {name, description} = req.body;
  //TODO: update playlist
  if (!(name || description)) {
    throw new ApiError(402, "all fields are required");
  }
  if (isValidObjectId(playlistId)) {
    throw new ApiError(
      407,
      "Invalid playlistId does not cast into mongoDb _id"
    );
  }
  const playlistExist = await Playlist.findById(playlistId);
  if (!playlistExist) {
    throw new ApiError(401, "Playlist with the same Id does not exist");
  }
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
