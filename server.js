require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "DELETE"],
  },
});

// Export the io instance for use in routes
module.exports.io = io;

// ---------------------
// Middleware
// ---------------------
app.use(cors());
app.use(express.json());

// ---------------------
// Health Check Route
// ---------------------
app.get("/", (req, res) => {
  res.send("✅ Comment API with Ethereum Auth is live!");
});

// ---------------------
// Routes
// ---------------------
const commentRoutes = require("./routes/comments");
app.use("/api/comments", commentRoutes);

// ---------------------
// MongoDB Connection
// ---------------------
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ---------------------
// Socket.IO
// ---------------------
io.on("connection", (socket) => {
  console.log("🟢 New client connected");

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected");
  });
});

// ---------------------
// Start the Server
// ---------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
