import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

export const upload = multer({
  storage,
  limits: {fileSize: 100 * 1024 * 1024},
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/mkv",
      "video/webm",
      "video/avi",
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Only image and video files are allowed"), false);
    }
    cb(null, true);
  },
});
