import multer from "multer";

// We use MemoryStorage so the file buffer is kept in RAM
// This allows us to pipe it directly to Cloudinary without writing it to disk.
const storage = multer.memoryStorage();

// General file filter: allow common images and videos
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/") ||
    file.mimetype === "application/pdf"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type! Please upload an image, video, or PDF."), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB max for videos/files. Adjust depending on infrastructure limits.
  },
});
