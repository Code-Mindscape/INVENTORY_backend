import express from "express";
import { Order } from "../models/Order.Model.js";
import { Product } from "../models/Product.Model.js";
import { Worker } from "../models/Worker.Model.js";
import { isAuthenticated, isAdmin, isWorker } from "../middlewares/authMiddleware.js"; // ✅ Using middleware for cleaner code

const router = express.Router();

// ✅ Worker can add an order
router.post("/addOrder", isAuthenticated, isWorker, async (req, res) => {
  try {
    const { productID, customerName, quantity, address, contact, cod, description } = req.body;
    const workerID = req.session.user.id;

    // ✅ Check if product exists
    const product = await Product.findById(productID);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // ✅ Ensure stock is available
    if (product.stock < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    // ✅ Deduct stock and save
    product.stock -= quantity;
    await product.save();

    // ✅ Create and save new order
    const newOrder = new Order({
      workerID,
      productID,
      customerName,
      quantity,
      address,
      contact,
      cod,
      description,
      delivered: false,
    });
    await newOrder.save();

    res.status(201).json({ message: "Order added successfully", order: newOrder });
  } catch (error) {
    console.error("Error adding order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Worker can view their own orders
router.get("/my-orders", isAuthenticated, isWorker, async (req, res) => {
  try {
    const { page = 1, limit = 8, search = "" } = req.query;

    // Convert query params to numbers
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // Construct search filter
    const searchFilter = {
      workerID: req.session.user.id,
      $or: [
        { customerName: { $regex: search, $options: "i" } }, // Case-insensitive search for customer name
        { "productID.name": { $regex: search, $options: "i" } } // Search by product name
      ],
    };

    // Count total filtered orders
    const totalCount = await Order.countDocuments(searchFilter);

    // Fetch paginated and filtered orders
    const myOrders = await Order.find(searchFilter)
      .populate({ path: "productID", select: "name size color imageUrl" })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    // Fetch worker's username
    const worker = await Worker.findById(req.session.user.id).select("username").lean();

    res.json({ 
      myOrders, 
      workername: worker ? worker.username : "Unknown Worker",
      totalCount 
    });
  } catch (error) {
    console.error("Error fetching worker orders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});




// ✅ Admin can view all orders
router.get("/allOrders", isAuthenticated, isAdmin, async (req, res) => {
  try {
    let { page = 1, limit = 8, search = "" } = req.query;

    // Ensure page and limit are positive numbers
    page = Math.max(1, parseInt(page, 10) || 1);
    limit = Math.max(1, parseInt(limit, 10) || 8);
    
    // Build the search filter
    const searchFilter = search
      ? { customerName: { $regex: search, $options: "i" } } // Case-insensitive search
      : {};

    // Fetch total count and orders concurrently for better performance
    const [totalCount, orders] = await Promise.all([
      Order.countDocuments(searchFilter), // Count documents with search filter
      Order.find(searchFilter)
        .populate("productID", "name size color imageUrl")
        .populate("workerID", "username")
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
    ]);

    res.status(200).json({ orders, totalCount });
  } catch (error) {
    console.error("Error fetching all orders:", error);
    res.status(500).json({ message: "Failed to retrieve orders", error: error.message });
  }
});


// ✅ Admin can delete an order
router.delete("/delOrder/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedOrder = await Order.findByIdAndDelete(id);
    
    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Admin can update order status
router.put("/updateOrder/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { delivered } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.delivered = delivered;
    await order.save();

    res.json({ message: "Order updated successfully", order });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
