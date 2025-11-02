// C:\Users\User\comment-backend\routes\createComment.js
const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const { createComment } = require("../models/EthComment");

const MAX_COMMENT_LENGTH = 200;

router.post("/", authenticate, async (req, res) => {
  const {
    postId,
    content: bodyContent,
    text: bodyText,
    parentId,
    likes,
    metadata,
  } = req.body;

  const content = typeof bodyContent === "string" ? bodyContent : bodyText;

  console.log(`[createComment] postId: ${postId}, content: ${content?.slice(0, 50)}...`);

  if (!content || !postId) {
    console.warn("[createComment] Missing postId or content");
    return res.status(400).json({ message: "Content and postId are required" });
  }

  if (content.length > MAX_COMMENT_LENGTH) {
    console.warn(`[createComment] Comment too long: ${content.length} > ${MAX_COMMENT_LENGTH}`);
    return res.status(400).json({ message: `Comment exceeds the ${MAX_COMMENT_LENGTH} character limit` });
  }

  if (!req.user?.ethereumAddress) {
    console.warn("[createComment] Missing ethereum address on authenticated user");
    return res.status(400).json({ message: "Missing ethereum address for user" });
  }

  const sanitizedParentId =
    typeof parentId === "string" && parentId.trim().length
      ? parentId.trim()
      : null;

  const initialLikes = typeof likes === "number" && likes >= 0 ? likes : undefined;
  const userId = req.user.userId || req.user.id || req.user.ethereumAddress;

  try {
    const savedComment = await createComment({
      postId,
      ethereumAddress: req.user.ethereumAddress,
      username: req.user.username || "Anonymous",
      content,
      parentId: sanitizedParentId,
      userId,
      likes: initialLikes,
      metadata,
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("comment:created", savedComment);
    }

    console.log("[createComment] Comment saved:", savedComment._id);
    res.status(201).json(savedComment);
  } catch (err) {
    console.error("[createComment] Error creating comment:", err);
    if (err.message?.includes("character")) {
      return res.status(400).json({ message: err.message });
    }

    if (err.message?.includes("Missing required")) {
      return res.status(400).json({ message: err.message });
    }

    if (err.message === "Parent comment not found") {
      return res.status(err.status || 404).json({ message: err.message });
    }

    if (err.message === "Parent comment belongs to a different post") {
      return res.status(err.status || 400).json({ message: err.message });
    }

    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;