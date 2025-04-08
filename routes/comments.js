const express = require("express");
const router = express.Router();
const Comment = require("../models/EthComment");
const io = require("../server").io;
const jwt = require("jsonwebtoken");

const MAX_COMMENT_LENGTH = 200; // Character limit for comments

// 🔐 Middleware to verify JWT and extract Ethereum address
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, ethereumAddress, username, roles }
    next();
  } catch (err) {
    console.error("❌ JWT Verification Failed:", err.message);
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

// GET all comments for a post (paginated)
router.get("/:postId", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    // Find comments for the post
    const comments = await Comment.find({ postId: req.params.postId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Return an empty array if no comments are found
    if (!comments || comments.length === 0) {
      return res.json({ comments: [], totalPages: 0, currentPage: page });
    }

    // Calculate total pages
    const total = await Comment.countDocuments({ postId: req.params.postId });

    res.json({
      comments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error("❌ Error fetching comments:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST a new comment (Ethereum-based)
router.post("/", authenticate, async (req, res) => {
  const { content, postId } = req.body;

  if (!content || !postId) {
    return res.status(400).json({ message: "Content and postId are required" });
  }

  // Validate comment length
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

    io.emit("newComment", savedComment);
    res.status(201).json(savedComment);
  } catch (err) {
    console.error("❌ Error creating comment:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE a comment
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Optional: Only allow user to delete their own comment
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
