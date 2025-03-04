import express from "express";
import bcrypt from "bcrypt";
import { Admin } from "../models/Admin.Model.js";
import { Worker } from "../models/Worker.Model.js";
import session from "express-session";

const router = express.Router();
dotenv.config();

// ✅ Worker Login
router.post(`https://inventorybackend-production-6c3c.up.railway.app/worker-login`, async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await Worker.findOne({ username });
    if (!user) return res.status(400).json({ message: "User not found" });

    // ✅ Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // ✅ Store session data
    req.session.user = { id: user._id, username: user.username, role: "worker" };

    res.json({ message: "Worker login successful", user: req.session.user });
  } catch (error) {
    console.error("Worker login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Worker Registration
router.post(`https://inventorybackend-production-6c3c.up.railway.app/worker-register`, async (req, res) => {
  try {
    const { username, workerID } = req.body;

    // ✅ Hash password before saving
    const hashedID = await bcrypt.hash(workerID, 10);

    const newWorker = new Worker({
      username,
      workerID: hashedID,
    });

    await newWorker.save();

    res.status(201).json({ message: "Worker registered successfully" });
  } catch (error) {
    console.error("Worker registration error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Admin Login
router.post(`https://inventorybackend-production-6c3c.up.railway.app/admin-login`, async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(400).json({ message: "Admin not found" });

    // ✅ Compare hashed password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // ✅ Store session data
    req.session.user = { id: admin._id, username: admin.username, role: "admin" };

    res.json({ message: "Admin login successful", user: req.session.user });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// ✅ Logout for both Admin & Worker
router.post(`https://inventorybackend-production-6c3c.up.railway.app/logout`, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    res.json({ message: "Logout successful" });
  });
});

router.get(`https://inventorybackend-production-6c3c.up.railway.app/check-auth`, (req, res) => {
  if (req.session.user) {
    return res.json({ authenticated: true, user: req.session.user });
  }

  res.status(401).json({ authenticated: false, message: "Unauthorized: Please log in" });
});


export default router;
