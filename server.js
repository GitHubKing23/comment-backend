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

const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "https://sportifyinsider.com"],
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
  },
});

app.set("io", io);

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

// ✅ Logger middleware: IP, Origin, User-Agent
app.use((req, res, next) => {
  const ip =
    req.headers["x-forwarded-for"] ||
    req.socket?.remoteAddress ||
    "unknown";

  const userAgent = req.headers["user-agent"] || "unknown";
  const origin = req.headers.origin || "direct";

  console.log(
    `[Logger] ${new Date().toISOString()} | ${req.method} ${req.url} | IP: ${ip} | Origin: ${origin} | UA: ${userAgent}`
  );

  res.on("finish", () => {
    console.log(`[Server] Response for ${req.method} ${req.url}: status=${res.statusCode}`);
  });

  next();
});

// ✅ Security middleware: Block unwanted access to /api/comments
app.use("/api/comments", (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = ["https://sportifyinsider.com"];

  if (!origin || !allowedOrigins.includes(origin)) {
    console.warn(`[Block] Forbidden /api/comments hit from origin: ${origin}`);
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
});

app.get("/", (req, res) => {
  res.send("✅ Comment API is live!");
});

// Routes
app.use("/api/comments", fetchComments);
app.use("/api/comments", createComment);
app.use("/api/comments", deleteComment);

// 404 Fallback
app.use((req, res) => {
  console.error(`[Server] 404: ${req.method} ${req.url}`);
  res.status(404).json({ error: "Route not found" });
});

// DB Connection
const MONGO_URI = process.env.MONGO_URI;
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

// Start Server
const PORT = process.env.PORT || 5004;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
