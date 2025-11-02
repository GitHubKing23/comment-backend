const { aql, getCommentsCollection, db } = require("../db/arango");

const MAX_COMMENT_LENGTH = 200;

function mapDocumentToResponse(doc = {}) {
  if (!doc) {
    return null;
  }

  const { _key, _id, _rev, ...rest } = doc;

  const response = {
    _id: _key || _id,
    _rev,
    ...rest,
  };

  if (!response.content && typeof response.text === "string") {
    response.content = response.text;
  }

  if (!response.text && typeof response.content === "string") {
    response.text = response.content;
  }

  if (response.likes == null) {
    response.likes = 0;
  }

  if (response.parentId === undefined) {
    delete response.parentId;
  }

  return response;
}

async function createComment({
  postId,
  ethereumAddress,
  username,
  content,
  parentId,
  userId,
  likes,
  metadata,
}) {
  if (!postId || !ethereumAddress || !content) {
    throw new Error("Missing required comment fields");
  }

  if (content.length > MAX_COMMENT_LENGTH) {
    throw new Error(`Comment exceeds the ${MAX_COMMENT_LENGTH} character limit`);
  }

  const collection = getCommentsCollection();
  const now = new Date().toISOString();
  const document = {
    postId,
    ethereumAddress: ethereumAddress.toLowerCase(),
    userId: userId || ethereumAddress.toLowerCase(),
    username: username || "Anonymous",
    text: content,
    content,
    parentId: parentId || null,
    likes: typeof likes === "number" && likes >= 0 ? likes : 0,
    createdAt: now,
    updatedAt: now,
  };

  if (metadata !== undefined) {
    document.metadata = metadata;
  }

  const meta = await collection.save(document);

  return mapDocumentToResponse({
    ...document,
    _key: meta._key,
    _rev: meta._rev,
  });
}

async function findCommentsByPost(postId, { skip = 0, limit = 10 } = {}) {
  if (!postId) {
    return [];
  }

  const cursor = await db.query(aql`
    FOR comment IN ${getCommentsCollection()}
      FILTER comment.postId == ${postId}
      SORT comment.createdAt DESC
      LIMIT ${skip}, ${limit}
      RETURN comment
  `);

  const results = await cursor.all();
  return results.map(mapDocumentToResponse).filter(Boolean);
}

async function countCommentsByPost(postId) {
  const cursor = await db.query(aql`
    RETURN LENGTH(
      FOR comment IN ${getCommentsCollection()}
        FILTER comment.postId == ${postId}
        RETURN 1
    )
  `);

  const [count] = await cursor.all();
  return count || 0;
}

async function findCommentById(id) {
  if (!id) {
    return null;
  }

  const collection = getCommentsCollection();

  try {
    const document = await collection.document(id);
    return mapDocumentToResponse(document);
  } catch (error) {
    if (error.code === 404 || error.errorNum === 1202) {
      return null;
    }

    throw error;
  }
}

async function deleteCommentById(id) {
  if (!id) {
    return false;
  }

  const collection = getCommentsCollection();

  try {
    await collection.remove(id);
    return true;
  } catch (error) {
    if (error.code === 404 || error.errorNum === 1202) {
      return false;
    }

    throw error;
  }
}

module.exports = {
  createComment,
  findCommentsByPost,
  countCommentsByPost,
  findCommentById,
  deleteCommentById,
};
