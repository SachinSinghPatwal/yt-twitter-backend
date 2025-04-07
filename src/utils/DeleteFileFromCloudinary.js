import {v2 as cloudinary} from "cloudinary";
import {ApiError} from "./ApiError.js";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
export const deleteFile = async (
  url,
  destinationPathToCloudinary,
  resource_type = "image"
) => {
  try {
    if (!url) {
      throw new ApiError(400, "Invalid publicId");
    }
    const publicId = url.split("/").slice(-1)[0].split(".")[0];
    if (!publicId) {
      throw new ApiError(500, "Something went wrong when parsing url");
    }
    const response = await cloudinary.uploader.destroy(
      `${destinationPathToCloudinary}/${publicId}`,
      {
        resource_type,
        invalidate: true,
      }
    );
    return response;
  } catch (error) {
    throw error;
  }
};
