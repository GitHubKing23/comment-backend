// C:\Users\User\comment-backend\server.js
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

app.use((req, res, next) => {
  console.log(`[Server] ${req.method} ${req.url} from ${req.headers.origin}, Authorization: ${req.headers.authorization ? req.headers.authorization.slice(0, 15) + "..." : "none"}`);
  res.on("finish", () => {
    console.log(`[Server] Response for ${req.method} ${req.url}: status=${res.statusCode}`);
  });
  next();
});

app.get("/", (req, res) => {
  res.send("✅ Comment API is live!");
});

app.use("/api/comments", fetchComments);
app.use("/api/comments", createComment);
app.use("/api/comments", deleteComment);

app.use((req, res) => {
  console.error(`[Server] 404: ${req.method} ${req.url}`);
  res.status(404).json({ error: "Route not found" });
});

const MONGO_URI = process.env.MONGO_URI;
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

const PORT = process.env.PORT || 5004;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});