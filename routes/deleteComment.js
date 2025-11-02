const express = require("express");
const authenticate = require("../middleware/authenticate");
const {
  findCommentById,
  deleteCommentById,
} = require("../models/EthComment");

const router = express.Router();

router.delete("/:id", authenticate, async (req, res) => {
  try {
    const comment = await findCommentById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.ethereumAddress !== req.user.ethereumAddress) {
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
