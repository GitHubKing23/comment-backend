require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);

// ✅ Setup Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === "development"
      ? "http://localhost:3000"  // Allowing local dev frontend
      : process.env.FRONTEND_URL || "https://sportifyinsider.com", // Use environment variable for production URL
    methods: ["GET", "POST", "DELETE"],
  },
});

// ✅ Export the io instance
module.exports.io = io;

// ---------------------
// Middleware
// ---------------------
// CORS setup for Express routes
const corsOptions = {
  origin: process.env.NODE_ENV === "development"
    ? "http://localhost:3000"  // Allowing local dev frontend
    : process.env.FRONTEND_URL || "https://sportifyinsider.com", // Use environment variable for production URL
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions)); // Applying CORS middleware
app.use(express.json());

// ---------------------
// Health Check (✅ Make sure this route is defined before server starts)
// ---------------------
app.get("/", (req, res) => {
  res.send("✅ Comment API with Ethereum Auth is live!");
});

// ---------------------
// API Routes
// ---------------------
const commentRoutes = require("./routes/comments");
app.use("/api/comments", commentRoutes);

// ---------------------
// MongoDB Connection
// ---------------------
const MONGO_URI = process.env.MONGO_URI;
console.log("📦 Loaded .env file from:", path.resolve(__dirname, ".env"));
console.log("📂 File exists?", fs.existsSync(path.resolve(__dirname, ".env")));
console.log(" - PORT:", process.env.PORT);
console.log(" - MONGO_URI:", MONGO_URI ? "✅ Exists" : "❌ Missing");

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ---------------------
// Socket.IO Logic
// ---------------------
io.on("connection", (socket) => {
  console.log("🟢 New client connected");

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected");
  });
});

// ---------------------
// Start Server on Port 5004 — BIND to 0.0.0.0 for external access
// ---------------------
const PORT = process.env.PORT || 5004;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
