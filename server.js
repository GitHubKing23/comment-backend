// server.js
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

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
  res.send("✅ Comment API is live!");
});

// API Routes - Ensure these are correctly used
app.use("/api/comments", fetchComments);  // Handle GET requests for fetching comments
app.use("/api/comments", createComment);  // Handle POST requests for creating comments
app.use("/api/comments", deleteComment);  // Handle DELETE requests for deleting comments

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
