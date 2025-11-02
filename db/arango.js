const { Database, aql } = require("arangojs");

const {
  ARANGO_URL,
  RANGO_URL,
  ARANGO_DATABASE = "comments",
  ARANGO_USERNAME,
  ARANGO_PASSWORD,
  ARANGO_COMMENTS_COLLECTION,
  ARANGO_COLLECTION,
  ARANGO_USERS_COLLECTION,
  ARANGO_POSTS_COLLECTION,
  ARANGO_MODERATION_COLLECTION,
  ARANGO_SESSIONS_COLLECTION,
} = process.env;

const databaseUrl = ARANGO_URL || RANGO_URL || "http://127.0.0.1:8529";

const commentsCollectionName =
  ARANGO_COMMENTS_COLLECTION || ARANGO_COLLECTION || "comments";

const optionalCollections = [
  ARANGO_USERS_COLLECTION,
  ARANGO_POSTS_COLLECTION,
  ARANGO_MODERATION_COLLECTION,
  ARANGO_SESSIONS_COLLECTION,
]
  .filter((name) => typeof name === "string" && name.trim().length)
  .map((name) => name.trim())
  .filter((name) => name !== commentsCollectionName);

const collectionsToEnsure = [
  {
    name: commentsCollectionName,
    indexes: [{ type: "hash", fields: ["postId"], unique: false }],
  },
  ...optionalCollections.map((name) => ({ name })),
].reduce((acc, entry) => {
  if (!acc.some((existing) => existing.name === entry.name)) {
    acc.push(entry);
  }
  return acc;
}, []);

const db = new Database({ url: databaseUrl });

if (ARANGO_USERNAME && ARANGO_PASSWORD) {
  db.useBasicAuth(ARANGO_USERNAME, ARANGO_PASSWORD);
}

db.useDatabase(ARANGO_DATABASE);

async function ensureCollection({ name, indexes = [] }) {
  const collection = db.collection(name);
  const exists = await collection.exists();

  if (!exists) {
    await collection.create();
  }

  for (const index of indexes) {
    await collection.ensureIndex(index);
  }
}

async function initializeDatabase() {
  try {
    for (const collectionConfig of collectionsToEnsure) {
      await ensureCollection(collectionConfig);
    }
  } catch (error) {
    console.error("❌ Failed to initialise ArangoDB collection:", error.message);
    console.error(
      "Ensure database '%s' exists and credentials allow access.",
      ARANGO_DATABASE
    );
    throw error;
  }
}

function getCommentsCollection() {
  return db.collection(commentsCollectionName);
}

module.exports = {
  db,
  aql,
  initializeDatabase,
  getCommentsCollection,
};
