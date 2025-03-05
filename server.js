import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";
import MongoStore from "connect-mongo"; // ✅ Store sessions in MongoDB

import Auth from "./routes/Auth.js";
import Product from "./routes/Product.js";
import Order from "./routes/Order.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Environment Variables Validation
const MONGO_URI = process.env.MONGO_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is not defined in .env");
  process.exit(1);
}

if (!SESSION_SECRET) {
  console.error("❌ SESSION_SECRET is missing in .env");
  process.exit(1);
}

// ✅ Fix: Allow multiple origins
const allowedOrigins = ["https://enventorymanager.vercel.app", "http://localhost:3000"];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // ✅ Allow cookies to be sent
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use(cookieParser());

// ✅ Fix: Trust Proxy for Railway
app.set("trust proxy", 1);

// ✅ Fix: Store sessions in MongoDB instead of in-memory
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI }), // ✅ Persistent session storage
  cookie: {
    secure: process.env.NODE_ENV === "production", // ✅ Secure only in production
    httpOnly: true,
    sameSite: "None", // ✅ Required for cross-site requests
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },
}));

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed:`, error.message);
    process.exit(1);
  }
};
connectDB();

// Routes
app.use("/", Auth);
app.use("/product", Product);
app.use("/order", Order);

// Default Route
app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the API!" });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("🚨 Error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Graceful Shutdown
process.on("SIGINT", async () => {
  console.log("🛑 Server shutting down...");
  await mongoose.connection.close();
  console.log("📴 MongoDB Disconnected");
  process.exit(0);
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
