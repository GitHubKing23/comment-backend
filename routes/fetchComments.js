// routes/fetchComments.js

const express = require('express');
const Comment = require('../models/EthComment');

const router = express.Router();

// Handle fetching comments for a specific post (paginated)
router.get("/:postId", async (req, res) => {
  const { postId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    // Fetch comments for a specific post, with pagination
    const comments = await Comment.find({ postId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Comment.countDocuments({ postId });

    return res.status(200).json({
      comments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error("❌ Error fetching comments:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
