import {v2 as cloudinary} from "cloudinary";
import fs from "fs";
import {ApiError} from "./ApiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (
  localField,
  destinationPathToCloudinary,
  resource_type = "image"
) => {
  try {
    if (!(localField || destinationPathToCloudinary)) {
      throw new ApiError(
        400,
        "cant find either localField or destinationPathToCloudinary"
      );
    }
    const response = await cloudinary.uploader.upload(localField, {
      folder: destinationPathToCloudinary,
      resource_type,
    });
    if (!response) {
      throw new ApiError(
        500,
        "something went wrong while uploading asset on cloudinary"
      );
    }
    fs.unlinkSync(localField);
    if (destinationPathToCloudinary.includes("videos")) return response;
    return response.url;
  } catch (error) {
    fs.unlinkSync(localField);
    throw new ApiError(
      500,
      error?.message || "Error while initiating upload on cloudinary"
    );
  }
};

export {uploadOnCloudinary};
