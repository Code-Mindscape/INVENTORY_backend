import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet"; // ✅ Security Headers
import session from "express-session";
import cookieParser from "cookie-parser";
import MongoStore from "connect-mongo";
import { fileURLToPath } from "url";
import path from "path";

import AuthRoutes from "./routes/Auth.js";
import ProductRoutes from "./routes/Product.js";
import OrderRoutes from "./routes/Order.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// 📌 Validate Environment Variables
const { MONGO_URI, SESSION_SECRET, NODE_ENV } = process.env;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is not defined in .env");
  process.exit(1);
}

if (!SESSION_SECRET) {
  console.error("❌ SESSION_SECRET is missing in .env");
  process.exit(1);
}

// ✅ Enhanced Security with Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Allows inline styles/scripts if needed
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Fix for image loading
}));

// ✅ Improved CORS Handling
const allowedOrigins = ["https://enventorymanager.vercel.app", "http://localhost:3000"];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // ✅ Allow Cookies
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ✅ Essential Middleware
app.use(express.json({ limit: "5mb" })); // ✅ Allow JSON body up to 5MB
app.use(express.urlencoded({ extended: true })); // ✅ Handle URL-encoded data
app.use(cookieParser());

// ✅ Fix: Trust Proxy for Deployment (e.g., Railway, Vercel)
app.set("trust proxy", 1);

// ✅ Session Configuration (Stored in MongoDB)
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI }),
  cookie: {
    secure: NODE_ENV === "production",
    httpOnly: true,
    sameSite: "None", // ✅ Required for cross-origin sessions
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },
}));

// ✅ Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed:`, error.message);
    process.exit(1);
  }
};
connectDB();

// ✅ Routes
app.use("/auth", AuthRoutes);
app.use("/product", ProductRoutes);
app.use("/order", OrderRoutes);

// ✅ Static File Serving (If Needed for Frontend)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// ✅ Default Route
app.get("/", (req, res) => {
  res.status(200).json({ message: "🚀 Welcome to the API!" });
});

// ✅ Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("🚨 Error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ✅ Graceful Shutdown (Handles MongoDB and Express)
const shutdown = async () => {
  console.log("🛑 Server shutting down...");
  await mongoose.connection.close();
  console.log("📴 MongoDB Disconnected");
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
