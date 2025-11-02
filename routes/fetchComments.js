const express = require("express");
const {
  findCommentsByPost,
  countCommentsByPost,
} = require("../models/EthComment");

const router = express.Router();

// ✅ Fetch comments using query parameter (?postId=...)
router.get('/', async (req, res) => {
  const { postId } = req.query;
  console.log(`[fetchComments] Received postId: ${postId}`);

  // Validate postId presence
  if (!postId) {
    console.warn("[fetchComments] Missing postId");
    return res.status(400).json({ message: "Missing postId" });
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const skip = (page - 1) * limit;

  try {
    const comments = await findCommentsByPost(postId, { skip, limit });
    const total = await countCommentsByPost(postId);

    console.log(`[fetchComments] Found ${comments.length} comments for postId ${postId}`);

    return res.status(200).json({
      comments,
      totalPages: total ? Math.ceil(total / limit) : 0,
      currentPage: page,
    });
  } catch (err) {
    console.error(`[fetchComments] Server error while fetching comments`, err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
