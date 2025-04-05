import {v2 as cloudinary} from "cloudinary";
import {ApiError} from "./ApiError.js";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
export const deleteFile = async (url, destinationPathToCloudinary) => {
  try {
    if (!url) {
      throw new ApiError(400, "Invalid publicId");
    }
    const publicId = url.split("/").slice(-1)[0].split(".")[0];
    console.log(publicId, url);
    if (!publicId) {
      throw new ApiError(500, "Something went wrong when parsing url");
    }
    const response = await cloudinary.uploader.destroy(
      `${destinationPathToCloudinary}/${publicId}`,
      {
        invalidate: true,
      }
    );
    if (response.result == "not found") {
      throw new ApiError(500, "file not Found in Cloudinary");
    }
    console.log("old file delete", response);
    return response;
  } catch (error) {
    throw new ApiError(
      501,
      error?.message ||
        "something went wrong while updating the file in cloudinary"
    );
  }
};
