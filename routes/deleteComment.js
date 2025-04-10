// routes/deleteComment.js

const express = require('express');
const Comment = require('../models/EthComment');
const jwt = require('jsonwebtoken');

const router = express.Router();

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

// Handle deleting a comment
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Ensure the user is deleting their own comment
    if (comment.ethereumAddress !== req.user.ethereumAddress) {
      return res.status(403).json({ message: "Forbidden: Not your comment" });
    }

    await comment.deleteOne();
    res.json({ message: "Comment deleted" });
  } catch (err) {
    console.error("❌ Error deleting comment:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
