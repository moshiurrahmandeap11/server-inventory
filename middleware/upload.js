import fs from "fs";
import multer from "multer";
import path from "path";

//  Allowed types grouped
const FILE_TYPES = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  video: ["video/mp4", "video/mkv", "video/mov"],
  file: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ],
};

//  Decide folder based on file type
const getFolder = (mimetype) => {
  if (FILE_TYPES.image.includes(mimetype)) return "images";
  if (FILE_TYPES.video.includes(mimetype)) return "videos";
  if (FILE_TYPES.file.includes(mimetype)) return "files";
  return "others";
};

//  Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = getFolder(file.mimetype);
    const uploadPath = `uploads/${folder}`;

    // create folder if not exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;

    cb(null, uniqueName);
  },
});

//  File filter (security)
const fileFilter = (req, file, cb) => {
  const allowed = Object.values(FILE_TYPES).flat();
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type"), false);
  }
};

// 🚀 Final upload middleware
const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 300, // 300MB
  },
  fileFilter,
});

export default upload;
