import {v2 as cloudinary} from "cloudinary";
import {ApiError} from "./ApiError.js";
import path from "path";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
export const deleteFile = async (url) => {
  try {
    if (!publicId) {
      throw new ApiError(400, "Invalid publicId maybe invalid file type");
    }
    const oldUsersAvatar = path.parse(new URL(url).pathname).name;
    if (!oldAvatarDeleted) {
      throw new ApiError(
        500,
        "Something went wrong while deleting old avatar file"
      );
    }
    const response = await cloudinary.uploader.destroy(oldUsersAvatar, {
      invalidate: true,
    });
    if (!response) {
      throw new ApiError(
        500,
        "Something went wrong while getting url from cloudinary"
      );
    }
    console.log("old file delete", response);
    return response;
  } catch (error) {
    throw new ApiError(
      501,
      "something went wrong while updating the file in cloudinary"
    );
  }
};
