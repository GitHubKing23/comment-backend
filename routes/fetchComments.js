const express = require("express");
const mongoose = require("mongoose");
const Comment = require("../models/EthComment");

const router = express.Router();

// ✅ Fetch comments using query parameter (?postId=...)
router.get('/', async (req, res) => {
  const { postId } = req.query;   // Switched from req.params to req.query
  console.log(`[fetchComments] Received postId: ${postId}`);

  // Validate postId
  if (!postId) {
    console.warn("[fetchComments] Missing postId");
    return res.status(400).json({ message: "Missing postId" });
  }

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    console.warn(`[fetchComments] Invalid ObjectId: ${postId}`);
    return res.status(400).json({ message: "Invalid postId format" });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
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
    console.error(`[fetchComments] Error fetching comments`, err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
