// C:\Users\User\comment-backend\routes\createComment.js
const express = require("express");
const router = express.Router();
const Comment = require("../models/EthComment");
const jwt = require("jsonwebtoken");

const MAX_COMMENT_LENGTH = 200;

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log(`[authenticate] Authorization header: ${authHeader || "none"}`);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("[authenticate] No token provided");
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`[authenticate] Decoded token:`, decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error(`[authenticate] JWT Verification Failed: ${err.message}`);
    return res.status(401).json({ message: `Unauthorized: Invalid token - ${err.message}` });
  }
};

router.post("/", authenticate, async (req, res) => {
  const { content, postId } = req.body;
  console.log(`[createComment] postId: ${postId}, content: ${content?.slice(0, 50)}...`);

  if (!content || !postId) {
    console.warn("[createComment] Missing postId or content");
    return res.status(400).json({ message: "Content and postId are required" });
  }

  if (content.length > MAX_COMMENT_LENGTH) {
    console.warn(`[createComment] Comment too long: ${content.length} > ${MAX_COMMENT_LENGTH}`);
    return res.status(400).json({ message: `Comment exceeds the ${MAX_COMMENT_LENGTH} character limit` });
  }

  try {
    const newComment = new Comment({
      postId,
      ethereumAddress: req.user.ethereumAddress,
      username: req.user.username || "Anonymous",
      content,
    });

    const savedComment = await newComment.save();
    console.log("[createComment] Comment saved:", savedComment._id);
    res.status(201).json(savedComment);
  } catch (err) {
    console.error("[createComment] Error creating comment:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;