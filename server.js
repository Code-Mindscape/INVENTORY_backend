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

// Validate Essential Environment Variables
const { MONGO_URI, SESSION_SECRET, NODE_ENV } = process.env;
if (!MONGO_URI || !SESSION_SECRET) {
  console.error("❌ Missing required environment variables (MONGO_URI, SESSION_SECRET)");
  process.exit(1);
}


const corsOptions = {
  origin: "https://enventorymanager.vercel.app", // Allow frontend domain
  credentials: true, // Allow cookies/session
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

// Session Configuration
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: NODE_ENV === "production", // HTTPS only in production
      httpOnly: true,
      sameSite: NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 24 * 60 * 60 * 1000, // 1-day expiration
    },
  })
);

// Connect to MongoDB with Retry Logic
const connectDB = async (retries = 5, delay = 5000) => {
  while (retries) {
    try {
      await mongoose.connect(MONGO_URI);
      console.log("✅ MongoDB Connected");
      return;
    } catch (error) {
      console.error(`❌ MongoDB Connection Failed (${5 - retries + 1}/5): ${error.message}`);
      retries--;
      if (!retries) {
        console.error("❌ Maximum connection attempts reached. Exiting...");
        process.exit(1);
      }
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};
connectDB();

// Async Error Handling Wrapper
const wrapAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// API Routes
app.use("/auth", wrapAsync(Auth));
app.use("/product", wrapAsync(Product));
app.use("/order", wrapAsync(Order));

// Default Route
app.get("/", (req, res) => res.status(200).json({ message: "Welcome to the API!" }));

// Global Error Handler
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
