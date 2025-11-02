const { Database, aql } = require("arangojs");

const {
  ARANGO_URL,
  RANGO_URL,
  ARANGO_DATABASE = "COMMENTSBACKEND",
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

const rootDb = new Database({ url: databaseUrl });

const hasCredentials = ARANGO_USERNAME && ARANGO_PASSWORD;

if (ARANGO_USERNAME && ARANGO_PASSWORD) {
  rootDb.useBasicAuth(ARANGO_USERNAME, ARANGO_PASSWORD);
}

let db = rootDb;

if (ARANGO_DATABASE) {
  if (typeof rootDb.useDatabase === "function") {
    try {
      rootDb.useDatabase(ARANGO_DATABASE);
    } catch (error) {
      console.error(
        `❌ Failed to select database via useDatabase('${ARANGO_DATABASE}'):`,
        error.message
      );
      console.warn("Attempting legacy database() fallback…");
      if (typeof rootDb.database === "function") {
        db = rootDb.database(ARANGO_DATABASE);
        if (hasCredentials && typeof db.useBasicAuth === "function") {
          db.useBasicAuth(ARANGO_USERNAME, ARANGO_PASSWORD);
        }
      }
    }
  } else if (typeof rootDb.database === "function") {
    db = rootDb.database(ARANGO_DATABASE);
    if (hasCredentials && typeof db.useBasicAuth === "function") {
      db.useBasicAuth(ARANGO_USERNAME, ARANGO_PASSWORD);
    }
  } else {
    console.warn(
      "⚠️ Current arangojs version does not expose useDatabase/database helpers; using default database"
    );
  }
} else {
  console.warn("⚠️ ARANGO_DATABASE is not set. Falling back to default database");
}

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
    const collections = await db.listCollections();
    console.log(
      `✅ Connected to ArangoDB: ${ARANGO_DATABASE || "_system"} (collections: ${collections.length})`
    );

    for (const collectionConfig of collectionsToEnsure) {
      await ensureCollection(collectionConfig);
    }
  } catch (error) {
    console.error(
      `❌ Failed to initialise ArangoDB database '${ARANGO_DATABASE || "_system"}':`,
      error.message
    );
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
