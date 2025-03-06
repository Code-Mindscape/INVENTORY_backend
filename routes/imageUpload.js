import express from "express";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.post("/uploadImage", upload.single("image"), (req, res) => {
  try {
    res.json({ imageUrl: req.file.path }); // ✅ Return Cloudinary URL
  } catch (error) {
    res.status(500).json({ message: "Image upload failed", error: error.message });
  }
});

export default router;
