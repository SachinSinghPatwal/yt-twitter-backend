import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (fileObject) => {
  try {
    if (!fileObject.path) return null;
    const response = await cloudinary.uploader.upload(fileObject.path, {
      folder:
        fileObject.fieldname == "avatar"
          ? "images/usersImages/avatars"
          : "images/usersImages/coverImages",
      resource_type: fileObject.mimetype.split("/")[0],
    });
    console.log("file is uploaded on cloudinary ", response.url);
    fs.unlinkSync(fileObject.path);
    return response.url;
  } catch (error) {
    fs.unlinkSync(fileObject.path);
    console.log("Error while uploading file on cloudinary \n", error.message);
    return null;
  }
};

export {uploadOnCloudinary};
