const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("../models/EthComment", () => ({
  createComment: jest.fn(),
  findCommentsByPost: jest.fn(),
  countCommentsByPost: jest.fn(),
  findCommentById: jest.fn(),
  deleteCommentById: jest.fn(),
  findCommentsTreeByPost: jest.fn(),
}));

process.env.JWT_SECRET = "test-secret";
process.env.ALLOWED_ORIGINS = "http://localhost:3000";

const {
  createComment,
  findCommentsByPost,
  countCommentsByPost,
  findCommentById,
  deleteCommentById,
  findCommentsTreeByPost,
} = require("../models/EthComment");

const { app } = require("../app");

describe("Comment routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/comments", () => {
    it("rejects unauthenticated requests", async () => {
      const response = await request(app)
        .post("/api/comments")
        .send({ postId: "post-1", content: "Hello" });

      expect(response.statusCode).toBe(401);
      expect(createComment).not.toHaveBeenCalled();
    });

    it("creates a comment for authenticated users", async () => {
      const token = jwt.sign(
        { ethereumAddress: "0xabc", username: "Alice" },
        process.env.JWT_SECRET
      );

      createComment.mockResolvedValue({
        _id: "123",
        postId: "post-1",
        ethereumAddress: "0xabc",
        username: "Alice",
        userId: "0xabc",
        content: "Great post",
        text: "Great post",
        likes: 0,
        createdAt: new Date().toISOString(),
      });

      const response = await request(app)
        .post("/api/comments")
        .set("Authorization", `Bearer ${token}`)
        .send({ postId: "post-1", content: "Great post" });

      expect(response.statusCode).toBe(201);
      expect(createComment).toHaveBeenCalledWith(
        expect.objectContaining({
          postId: "post-1",
          ethereumAddress: "0xabc",
          username: "Alice",
          content: "Great post",
          userId: "0xabc",
          parentId: null,
        })
      );
      expect(response.body).toMatchObject({
        _id: "123",
        username: "Alice",
      });
    });

    it("creates a reply when parentId is provided", async () => {
      const token = jwt.sign(
        { ethereumAddress: "0xabc", username: "Alice", userId: "user-1" },
        process.env.JWT_SECRET
      );

      createComment.mockResolvedValue({
        _id: "456",
        postId: "post-1",
        ethereumAddress: "0xabc",
        username: "Alice",
        userId: "user-1",
        content: "Reply",
        parentId: "123",
        createdAt: new Date().toISOString(),
      });

      const response = await request(app)
        .post("/api/comments")
        .set("Authorization", `Bearer ${token}`)
        .send({ postId: "post-1", content: "Reply", parentId: " 123 " });

      expect(response.statusCode).toBe(201);
      expect(createComment).toHaveBeenCalledWith(
        expect.objectContaining({
          parentId: "123",
        })
      );
    });
  });

  describe("GET /api/comments", () => {
    it("requires a postId query", async () => {
      const response = await request(app).get("/api/comments");

      expect(response.statusCode).toBe(400);
    });

    it("returns comments for a post", async () => {
      findCommentsByPost.mockResolvedValue([
        {
          _id: "123",
          postId: "post-1",
          content: "Test comment",
          text: "Test comment",
          likes: 0,
          createdAt: new Date().toISOString(),
        },
      ]);
      countCommentsByPost.mockResolvedValue(1);

      const response = await request(app)
        .get("/api/comments")
        .query({ postId: "post-1" });

      expect(response.statusCode).toBe(200);
      expect(findCommentsByPost).toHaveBeenCalled();
      expect(response.body.comments).toHaveLength(1);
      expect(response.body.totalPages).toBe(1);
    });

    it("returns nested comments when includeReplies is true", async () => {
      findCommentsTreeByPost.mockResolvedValue([
        {
          _id: "root",
          postId: "post-1",
          content: "Root",
          replies: [
            { _id: "child", postId: "post-1", content: "Child", replies: [] },
          ],
        },
      ]);
      countCommentsByPost.mockResolvedValue(2);

      const response = await request(app)
        .get("/api/comments")
        .query({ postId: "post-1", includeReplies: "true" });

      expect(response.statusCode).toBe(200);
      expect(findCommentsTreeByPost).toHaveBeenCalledWith("post-1");
      expect(response.body.comments).toHaveLength(1);
      expect(response.body.totalComments).toBe(2);
    });
  });

  describe("DELETE /api/comments/:id", () => {
    it("rejects unauthenticated requests", async () => {
      const response = await request(app).delete("/api/comments/123");

      expect(response.statusCode).toBe(401);
      expect(deleteCommentById).not.toHaveBeenCalled();
    });

    it("rejects deleting another user's comment", async () => {
      const token = jwt.sign(
        { ethereumAddress: "0xabc", username: "Alice" },
        process.env.JWT_SECRET
      );

      findCommentById.mockResolvedValue({
        _id: "123",
        postId: "post-1",
        ethereumAddress: "0xdef",
        content: "Hello",
      });

      const response = await request(app)
        .delete("/api/comments/123")
        .set("Authorization", `Bearer ${token}`);

      expect(response.statusCode).toBe(403);
      expect(deleteCommentById).not.toHaveBeenCalled();
    });

    it("allows owners to delete their comment", async () => {
      const token = jwt.sign(
        { ethereumAddress: "0xabc", username: "Alice" },
        process.env.JWT_SECRET
      );

      findCommentById.mockResolvedValue({
        _id: "123",
        postId: "post-1",
        ethereumAddress: "0xabc",
        content: "Hello",
      });
      deleteCommentById.mockResolvedValue(true);

      const response = await request(app)
        .delete("/api/comments/123")
        .set("Authorization", `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(deleteCommentById).toHaveBeenCalledWith("123");
      expect(response.body).toMatchObject({ message: "Comment deleted" });
    });
  });
});
