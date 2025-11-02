require("dotenv").config();
const express = require("express");
const cors = require("cors");

const fetchComments = require("./routes/fetchComments");
const createComment = require("./routes/createComment");
const deleteComment = require("./routes/deleteComment");
const errorHandler = require("./middleware/errorHandler");

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set("allowedOrigins", allowedOrigins);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Comment API is live!");
});

app.get("/api/comments/health", (req, res) => {
  res.json({ status: "✅ Comment API is healthy!" });
});

app.use("/api/comments", fetchComments);
app.use("/api/comments", createComment);
app.use("/api/comments", deleteComment);

app.use(errorHandler);

module.exports = {
  app,
  allowedOrigins,
};
