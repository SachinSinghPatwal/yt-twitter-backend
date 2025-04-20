import mongoose from "mongoose";
import {Comment} from "../models/comment.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {Video} from "../models/video.model.js";
const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const {videoId} = req.params;
  const {page = 1, limit = 10, sortBy = -1, sortType = "createdAt"} = req.query;
  try {
    const matchStage = {
      video: new mongoose.Types.ObjectId(videoId),
    };
    const sortedComments = Comment.aggregate([
      {
        $match: matchStage,
      },
      {
        $sort: {[sortType]: parseInt(sortBy)},
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
          createdAt: 1,
          updatedAt: 1,
          content: 1,
          video: 1,
        },
      },
    ]);
    const pagination = {
      limit: parseInt(limit),
      page: parseInt(page),
    };
    const paginatedAndSortedComments = await Comment.aggregatePaginate(
      sortedComments,
      pagination
    );
    if (!paginatedAndSortedComments.length == 0) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            paginatedAndSortedComments,
            "No Comments found for this video"
          )
        );
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          paginatedAndSortedComments,
          "Comments fetched Successfully"
        )
      );
  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(500, error.message, "Something went wrong"));
  }
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const {videoId} = req.params;
  const {content} = req.body;
  if (!content || !videoId) {
    throw new ApiError(400, "content or videoId is empty");
  }
  const comment = await Comment.create({
    video: videoId,
    content,
    owner: req.user._id,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "commented created successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const {commentId} = req.params;
  const userId = req.user._id;
  const {content} = req.body;
  if (!commentId) {
    throw new ApiError(400, "comment Id is required");
  }
  const comment = await Comment.findByIdAndUpdate(
    {_id: commentId, owner: userId},
    {
      $match: {
        owner: user,
      },
    },
    {
      $set: {
        content: content,
      },
    },
    {
      new: true,
    }
  );
  if (!comment) {
    throw new ApiError(400, "your are not authorized to update this comment");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "comment successfully updated"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const {commentId} = req.params;
  if (!commentId) {
    throw new ApiError(
      400,
      "commentId is either empty or contain a falsy value"
    );
  }
  const deletedComment = await Comment.findByIdAndDelete(commentId);
  if (!deletedComment) {
    throw new ApiError(400, "comment was not deleted");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, deleteComment, "comment deleted successfully"));
});

export {getVideoComments, addComment, updateComment, deleteComment};
