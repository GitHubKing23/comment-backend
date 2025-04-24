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

const app = express();
const server = http.createServer(app);

// ✅ Dynamic CORS Origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://sportifyinsider.com"
];

// Setup Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "DELETE"],
    credentials: true
  }
});
app.set('io', io);

// ✅ CORS Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());

// ✅ Health Check Routes
app.get("/", (req, res) => {
  res.send("✅ Comment API is live!");
});

app.get("/api/comments/health", (req, res) => {
  res.json({ status: "✅ Comment API is healthy!" });
});

// ✅ API Routes
app.use("/api/comments", fetchComments);
app.use("/api/comments", createComment);
app.use("/api/comments", deleteComment);

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("✅ Connected to MongoDB");
}).catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
});

// ✅ Start Server
const PORT = process.env.PORT || 5004;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Comment API running on http://0.0.0.0:${PORT}`);
});
