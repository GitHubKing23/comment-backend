require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");

const fetchComments = require("./routes/fetchComments");
const createComment = require("./routes/createComment");
const deleteComment = require("./routes/deleteComment");

const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "https://sportifyinsider.com"],
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
  },
});
app.set("io", io);

// CORS setup
const allowedOrigins = ["http://localhost:3000", "https://sportifyinsider.com"];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`[CORS] Blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json());

// ✅ Logger middleware
app.use((req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  console.log(`[Logger] ${req.method} ${req.url} | IP: ${ip}`);
  next();
});

// ✅ Health Check Route
app.get('/api/comments/health', (req, res) => {
  res.json({ status: "Comment API is healthy ✅" });
});

// ✅ Protect /api/comments
app.use("/api/comments", (req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || origin !== "https://sportifyinsider.com") {
    console.warn(`[Block] Forbidden /api/comments hit from origin: ${origin}`);
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
});

// Routes
app.use("/api/comments", fetchComments);
app.use("/api/comments", createComment);
app.use("/api/comments", deleteComment);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// DB connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

// Start server
const PORT = process.env.PORT || 5004;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Comment Server running on http://0.0.0.0:${PORT}`);
});
