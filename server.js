import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";

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

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));


app.use(express.json());
app.use(cookieParser());

// Session Configuration (In-Memory Store)
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

// MongoDB Connection with Retry Logic
let retryCount = 0;
const MAX_RETRIES = 5;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed (${retryCount + 1}/${MAX_RETRIES}):`, error.message);
    retryCount++;

    if (retryCount < MAX_RETRIES) {
      setTimeout(connectDB, 5000); // Retry after 5 seconds
    } else {
      console.error("❌ Maximum connection attempts reached. Exiting...");
      process.exit(1);
    }
  }
  
};
connectDB();

// Routes with Error Handling Wrapper
const wrapAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.use("/", wrapAsync(Auth));
app.use("/product", wrapAsync(Product));
app.use("/order", wrapAsync(Order));

// Default Route
app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the API!" });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("🚨 Error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Graceful Shutdown Handling
process.on("SIGINT", async () => {
  console.log("🛑 Server shutting down...");
  await mongoose.connection.close();
  console.log("📴 MongoDB Disconnected");
  process.exit(0);
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
