const express = require('express');
const router = express.Router();
const Comment = require('../models/EthComment'); // Ensure you have the EthComment model here
const jwt = require('jsonwebtoken');

const MAX_COMMENT_LENGTH = 200;

// Middleware to authenticate the user
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded data to the request
    next();
  } catch (err) {
    console.error("❌ JWT Verification Failed:", err.message);
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

// POST a new comment
router.post("/", authenticate, async (req, res) => {
  const { content, postId } = req.body;

  if (!content || !postId) {
    return res.status(400).json({ message: "Content and postId are required" });
  }

  if (content.length > MAX_COMMENT_LENGTH) {
    return res.status(400).json({ message: `Comment exceeds the ${MAX_COMMENT_LENGTH} character limit` });
  }

  try {
    const newComment = new Comment({
      postId,
      ethereumAddress: req.user.ethereumAddress,
      username: req.user.username,
      content,
    });

    const savedComment = await newComment.save();
    res.status(201).json(savedComment); // Respond with the created comment
  } catch (err) {
    console.error("❌ Error creating comment:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Export the router properly
module.exports = router;

