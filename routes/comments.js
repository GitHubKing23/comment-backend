const express = require("express");
const router = express.Router();
const Comment = require("../models/Comment");
const io = require("../index").io; // Import the Socket.IO instance

// @route   GET /api/comments/:postId
// @desc    Get all comments for a specific post with pagination
router.get("/:postId", async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Default to page 1
  const limit = parseInt(req.query.limit) || 10; // Default to 10 comments per page
  const skip = (page - 1) * limit;

  try {
    const comments = await Comment.find({ postId: req.params.postId })
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments({ postId: req.params.postId });

    res.json({
      comments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/comments
// @desc    Create a new comment
router.post("/", async (req, res) => {
  const { name, email, content, postId } = req.body;

  if (!name || !email || !content || !postId) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newComment = new Comment({ name, email, content, postId });
    const savedComment = await newComment.save();

    // Notify all clients about the new comment
    io.emit("newComment", savedComment);

    res.status(201).json(savedComment);
  } catch (err) {
    console.error("Error creating comment:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/comments/:id
// @desc    Delete a comment by ID
router.delete("/:id", async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    await comment.remove();
    res.json({ message: "Comment deleted" });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;