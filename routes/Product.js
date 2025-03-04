import express from "express";
import { Product } from "../models/Product.Model.js";
import { isAuthenticated, isAdmin } from "../middlewares/authMiddleware.js"; // ✅ Using authentication middleware

const router = express.Router();

// ✅ Admin can add a new product
router.post("/addProduct", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { name, price, description, stock, size, color } = req.body;

    const newProduct = new Product({ name, price, description, stock, size, color });
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

// ✅ Public route - Anyone can view all products
router.get("/allProducts", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({ products });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
