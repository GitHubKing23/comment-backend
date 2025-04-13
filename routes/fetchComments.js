// C:\Users\User\comment-backend\routes\fetchComments.js
const express = require("express");
const mongoose = require("mongoose");
const Comment = require("../models/EthComment");

const router = express.Router();

// Handle fetching comments for a specific post (paginated)
router.get("/:postId", async (req, res) => {
  const { postId } = req.params;
  console.log(`[fetchComments] Received postId: ${postId}`);

  // Validate postId
  if (!postId) {
    console.warn("[fetchComments] Missing postId");
    return res.status(400).json({ message: "Missing postId" });
  }

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    console.warn(`[fetchComments] Invalid ObjectId: ${postId}`);
    return res.status(400).json({ message: "Invalid postId format" });
  }

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

    console.log(`[fetchComments] Found ${comments.length} comments for postId: ${postId}, total: ${total}`);

    return res.status(200).json({
      comments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error(`[fetchComments] Error fetching comments for postId: ${postId}`, err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;