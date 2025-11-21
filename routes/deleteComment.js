const express = require("express");
const authenticate = require("../middleware/authenticate");
const {
  findCommentById,
  deleteCommentById,
} = require("../models/Comment");

const router = express.Router();

router.delete("/:id", authenticate, async (req, res) => {
  try {
    const comment = await findCommentById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const commentOwnerId = comment.userId || comment.email;
    const requestUserId =
      req.user.userId || req.user.id || (req.user.email || "").trim().toLowerCase();

    if (!commentOwnerId || !requestUserId || commentOwnerId !== requestUserId) {
      return res.status(403).json({ message: "Forbidden: Not your comment" });
    }

    await deleteCommentById(req.params.id);

    const io = req.app.get("io");
    if (io) {
      io.emit("comment:deleted", {
        _id: req.params.id,
        postId: comment.postId,
      });
    }

    res.json({ message: "Comment deleted" });
  } catch (err) {
    console.error("❌ Error deleting comment:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
