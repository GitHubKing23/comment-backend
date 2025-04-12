require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");

// Import routes
const fetchComments = require("./routes/fetchComments");
const createComment = require("./routes/createComment");
const deleteComment = require("./routes/deleteComment");

// Initialize express and server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS settings
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://sportifyinsider.com",
    methods: ["GET", "POST", "DELETE"],
  },
});

// Make socket.io instance globally available
app.set('io', io);

// Define allowed origins for CORS
const allowedOrigins = [
  "http://localhost:3000",
  "https://sportifyinsider.com"
];

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
  res.send("✅ Comment API is live!");
});

// API Routes
app.use("/api/comments", fetchComments);  // GET route to fetch comments for a post
app.use("/api/comments", createComment);  // POST route to create a comment
app.use("/api/comments", deleteComment);  // DELETE route to delete a comment

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

// Start the server
const PORT = process.env.PORT || 5004;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});