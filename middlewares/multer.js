import multer from "multer";

// ✅ Configure Multer storage (Memory storage for Cloudinary)
const storage = multer.memoryStorage();

// ✅ File filter to allow only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// ✅ Multer Upload Configuration
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB file size limit
});

// ✅ Middleware to handle single image upload
export const uploadSingleImage = upload.single("image");

// ✅ Middleware to handle multiple image uploads (if needed)
export const uploadMultipleImages = upload.array("images", 5); // Allow max 5 images

