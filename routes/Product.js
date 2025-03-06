import express from "express";
import { Product } from "../models/Product.Model.js";
import { isAuthenticated, isAdmin } from "../middlewares/authMiddleware.js"; // ✅ Using authentication middleware
import { uploadSingleImage } from "../middlewares/multer.js";
import { uploadToCloudinary } from "../config/cloudinary.js";

const router = express.Router();



router.post("/addProduct", isAuthenticated, isAdmin, uploadSingleImage, async (req, res) => {
  try {
    const { name, price, description, stock, size, color } = req.body;

    if (!name || !price || !stock) {
      return res.status(400).json({ message: "Name, Price, and Stock are required." });
    }

    // ✅ Upload image to Cloudinary
    let imageUrl = "";
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer);
      imageUrl = uploadResult.secure_url;
    }

    const newProduct = new Product({ name, price, description, stock, size, color, imageUrl: imageUrl });
    await newProduct.save();

    res.status(201).json({ message: "Product added successfully", product: newProduct });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});



// ✅ Admin can delete a product
router.delete("/delProduct/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Public route - Anyone can view paginated products
router.get("/allProducts", async (req, res) => {
  try {
    let { page = 1, limit = 8 } = req.query;
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    const totalCount = await Product.countDocuments(); // Total number of products
    const products = await Product.find()
      .skip((page - 1) * limit) // Skip previous pages
      .limit(limit)
      .sort({ createdAt: -1 }); // Limit per page

    res.status(200).json({
      products,
      totalCount, // Send total count for pagination
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


export default router;
