/**
 * Database Manager Controller — admin-only endpoints for inspecting and
 * querying the MongoDB database via the Mongoose connection.
 *
 * Routes (all prefixed by the router, e.g. /api/v1/database):
 *  GET  /stats              — DB + server stats
 *  GET  /collections        — list all collections with sizes
 *  GET  /collections/:name  — detailed stats, indexes, sample docs
 *  GET  /insights           — aggregated application-level analytics
 *  POST /query              — ad-hoc find query (read-only)
 *  GET  /export/:name       — download a collection as JSON
 */

import asyncHandler from "../../middlewares/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import mongoose from "mongoose";

// Application models used in getInsights
import User from "../../models/usersModels/User.model.js";
import Project from "../../models/usersModels/Project.model.js";
import Message from "../../models/usersModels/Message.model.js";
import Notification from "../../models/usersModels/Notification.model.js";
import JobApplication from "../../models/usersModels/JobApplication.model.js";
import Conversation from "../../models/usersModels/Conversation.model.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Throw 403 if the requester is not an admin. */
const requireAdmin = (req) => {
  if (req.user.role !== "admin") {
    throw new AppError("Admin access required", 403);
  }
};

/**
 * Validate a collection name so it only contains safe characters.
 * Allowed: letters, digits, underscore, dot.
 */
const isValidCollectionName = (name) => /^[\w.]+$/.test(name);

// ---------------------------------------------------------------------------
// 1. GET /stats
// ---------------------------------------------------------------------------

export const getDbStats = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const db = mongoose.connection.db;

  // DB-level stats are always available
  const dbStats = await db.stats();

  const dbInfo = {
    db: dbStats.db,
    collections: dbStats.collections,
    objects: dbStats.objects,
    dataSize: dbStats.dataSize,
    storageSize: dbStats.storageSize,
    indexSize: dbStats.indexSize,
    avgObjSize: dbStats.avgObjSize,
    indexes: dbStats.indexes,
    ok: dbStats.ok,
  };

  // serverStatus is restricted on some Atlas tiers — handle gracefully
  let serverInfo = null;
  try {
    const serverStatus = await db.admin().serverStatus();
    serverInfo = {
      host: serverStatus.host,
      version: serverStatus.version,
      uptime: serverStatus.uptime,
      connections: serverStatus.connections
        ? {
            current: serverStatus.connections.current,
            available: serverStatus.connections.available,
            totalCreated: serverStatus.connections.totalCreated,
          }
        : null,
      mem: serverStatus.mem
        ? {
            resident: serverStatus.mem.resident,
            virtual: serverStatus.mem.virtual,
          }
        : null,
      opcounters: serverStatus.opcounters
        ? {
            insert: serverStatus.opcounters.insert,
            query: serverStatus.opcounters.query,
            update: serverStatus.opcounters.update,
            delete: serverStatus.opcounters.delete,
            getmore: serverStatus.opcounters.getmore,
            command: serverStatus.opcounters.command,
          }
        : null,
      network: serverStatus.network
        ? {
            bytesIn: serverStatus.network.bytesIn,
            bytesOut: serverStatus.network.bytesOut,
            numRequests: serverStatus.network.numRequests,
          }
        : null,
    };
  } catch (_err) {
    // Atlas M0/M2/M5 tiers do not support serverStatus — return partial data
    serverInfo = { note: "serverStatus not available on this MongoDB plan" };
  }

  return successResponse(res, "Database stats fetched successfully", {
    db: dbInfo,
    server: serverInfo,
  });
});

// ---------------------------------------------------------------------------
// 2. GET /collections
// ---------------------------------------------------------------------------

export const getCollections = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const db = mongoose.connection.db;
  const collectionInfos = await db.listCollections().toArray();
  const collectionNames = collectionInfos.map((c) => c.name);

  // Fetch stats for every collection; don't let one failure abort the rest
  const statsResults = await Promise.allSettled(
    collectionNames.map((name) =>
      db.command({ collStats: name, scale: 1024 })
    )
  );

  const collections = collectionNames
    .map((name, idx) => {
      const result = statsResults[idx];
      if (result.status === "fulfilled") {
        const s = result.value;
        return {
          name,
          count: s.count ?? 0,
          sizeKB: s.size ?? 0,
          avgObjSize: s.avgObjSize ?? 0,
          storageKB: s.storageSize ?? 0,
          indexSizeKB: s.totalIndexSize ?? 0,
          indexCount: s.nindexes ?? 0,
        };
      }
      // collStats failed for this collection — return minimal info
      return {
        name,
        count: 0,
        sizeKB: 0,
        avgObjSize: 0,
        storageKB: 0,
        indexSizeKB: 0,
        indexCount: 0,
        error: result.reason?.message ?? "stats unavailable",
      };
    })
    .sort((a, b) => b.count - a.count);

  return successResponse(res, "Collections fetched successfully", collections);
});

// ---------------------------------------------------------------------------
// 3. GET /collections/:name
// ---------------------------------------------------------------------------

export const getCollectionDetail = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const { name } = req.params;

  if (!isValidCollectionName(name)) {
    throw new AppError(
      "Invalid collection name. Only alphanumeric characters, underscores, and dots are allowed.",
      400
    );
  }

  const db = mongoose.connection.db;

  // Verify the collection exists
  const allCollections = await db.listCollections().toArray();
  const exists = allCollections.some((c) => c.name === name);
  if (!exists) {
    throw new AppError(`Collection '${name}' not found`, 404);
  }

  // Run stats, indexes, and sample docs in parallel
  const [statsResult, indexesResult, sampleResult] = await Promise.allSettled([
    db.command({ collStats: name, scale: 1024 }),
    db.collection(name).listIndexes().toArray(),
    db.collection(name).find({}).limit(5).toArray(),
  ]);

  const stats =
    statsResult.status === "fulfilled"
      ? statsResult.value
      : { error: statsResult.reason?.message ?? "stats unavailable" };

  const indexes =
    indexesResult.status === "fulfilled"
      ? indexesResult.value
      : [];

  const sampleDocs =
    sampleResult.status === "fulfilled"
      ? sampleResult.value
      : [];

  return successResponse(res, `Collection '${name}' details fetched`, {
    stats,
    indexes,
    sampleDocs,
  });
});

// ---------------------------------------------------------------------------
// 4. GET /insights
// ---------------------------------------------------------------------------

export const getInsights = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [
    signupsByMonth,
    usersByRole,
    projectsByStatus,
    jobAppsByStatus,
    totalsArr,
  ] = await Promise.all([
    // User signups grouped by year + month for the last 6 months
    User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),

    // Users broken down by role
    User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]),

    // Projects broken down by status
    Project.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),

    // Job applications broken down by status
    JobApplication.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),

    // Raw document counts for key collections
    Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      Message.countDocuments(),
      Conversation.countDocuments(),
      Notification.countDocuments(),
      JobApplication.countDocuments(),
    ]),
  ]);

  const [users, projects, messages, conversations, notifications, jobApplications] =
    totalsArr;

  return successResponse(res, "Database insights fetched successfully", {
    signupsByMonth,
    usersByRole,
    projectsByStatus,
    jobAppsByStatus,
    totals: {
      users,
      projects,
      messages,
      conversations,
      notifications,
      jobApplications,
    },
  });
});

// ---------------------------------------------------------------------------
// 5. POST /query
// ---------------------------------------------------------------------------

export const executeQuery = asyncHandler(async (req, res) => {
  requireAdmin(req);

  let { collection, filter, projection, sort, limit } = req.body;

  if (!collection || !isValidCollectionName(collection)) {
    throw new AppError(
      "Invalid or missing collection name. Only alphanumeric characters, underscores, and dots are allowed.",
      400
    );
  }

  // Parse string JSON inputs into objects
  const parseJsonField = (field, fieldName) => {
    if (!field) return {};
    if (typeof field === "object") return field;
    try {
      return JSON.parse(field);
    } catch {
      throw new AppError(`Invalid JSON for '${fieldName}'`, 400);
    }
  };

  filter = parseJsonField(filter, "filter");
  projection = parseJsonField(projection, "projection");
  sort = parseJsonField(sort, "sort");

  // Block unsafe operators
  if (JSON.stringify(filter).includes('"$where"')) {
    throw new AppError("Unsafe operator not allowed", 400);
  }

  // Clamp limit
  const safeLimit = Math.min(Number(limit) || 20, 50);

  const start = Date.now();

  const results = await mongoose.connection.db
    .collection(collection)
    .find(filter, { projection })
    .sort(sort)
    .limit(safeLimit)
    .toArray();

  const executionTimeMs = Date.now() - start;

  return successResponse(res, "Query executed successfully", {
    collection,
    count: results.length,
    executionTimeMs,
    results,
  });
});

// ---------------------------------------------------------------------------
// 6. GET /export/:name
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 7. GET /collections/:name/documents — paginated document browser
// ---------------------------------------------------------------------------

export const getDocuments = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const { name } = req.params;
  if (!isValidCollectionName(name)) {
    throw new AppError("Invalid collection name", 400);
  }

  const db = mongoose.connection.db;
  const allCollections = await db.listCollections().toArray();
  if (!allCollections.some((c) => c.name === name)) {
    throw new AppError(`Collection '${name}' not found`, 404);
  }

  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const skip  = (page - 1) * limit;
  const search = (req.query.search || "").toString().trim();

  let filter = {};
  if (search) {
    const { ObjectId } = mongoose.Types;
    // If it looks like a valid ObjectId, search by _id
    if (ObjectId.isValid(search)) {
      filter = { _id: new ObjectId(search) };
    } else {
      // Regex search on all top-level string fields
      // Build a $or by sampling the first doc to discover string fields
      const sample = await db.collection(name).findOne({});
      if (sample) {
        const stringFields = Object.keys(sample).filter(
          (k) => k !== "_id" && typeof sample[k] === "string"
        );
        if (stringFields.length > 0) {
          filter = {
            $or: stringFields.map((field) => ({
              [field]: { $regex: search, $options: "i" },
            })),
          };
        }
      }
    }
  }

  const [documents, total] = await Promise.all([
    db.collection(name).find(filter).sort({ _id: -1 }).skip(skip).limit(limit).toArray(),
    db.collection(name).countDocuments(filter),
  ]);

  return successResponse(res, "Documents fetched", {
    documents,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
      hasMore: page * limit < total,
    },
  });
});

// ---------------------------------------------------------------------------
// 8. POST /collections/:name/documents — insertOne
// ---------------------------------------------------------------------------

export const insertDocument = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const { name } = req.params;
  if (!isValidCollectionName(name)) {
    throw new AppError("Invalid collection name", 400);
  }

  const doc = req.body;
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
    throw new AppError("Request body must be a JSON object", 400);
  }

  const db = mongoose.connection.db;
  const result = await db.collection(name).insertOne(doc);

  return successResponse(res, "Document inserted successfully", {
    insertedId: result.insertedId,
  });
});

// ---------------------------------------------------------------------------
// 9. PUT /collections/:name/documents/:id — updateOne by _id
// ---------------------------------------------------------------------------

export const updateDocument = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const { name, id } = req.params;
  if (!isValidCollectionName(name)) {
    throw new AppError("Invalid collection name", 400);
  }

  const { ObjectId } = mongoose.Types;
  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    throw new AppError("Invalid document ID", 400);
  }

  const update = req.body;
  if (!update || typeof update !== "object" || Array.isArray(update)) {
    throw new AppError("Request body must be a JSON object", 400);
  }

  // Remove _id to avoid immutable field error
  const { _id, ...fields } = update;

  const db = mongoose.connection.db;
  const result = await db
    .collection(name)
    .updateOne({ _id: objectId }, { $set: fields });

  if (result.matchedCount === 0) {
    throw new AppError("Document not found", 404);
  }

  return successResponse(res, "Document updated successfully", {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  });
});

// ---------------------------------------------------------------------------
// 10. DELETE /collections/:name/documents/:id — deleteOne by _id
// ---------------------------------------------------------------------------

export const deleteDocument = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const { name, id } = req.params;
  if (!isValidCollectionName(name)) {
    throw new AppError("Invalid collection name", 400);
  }

  const { ObjectId } = mongoose.Types;
  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    throw new AppError("Invalid document ID", 400);
  }

  const db = mongoose.connection.db;
  const result = await db.collection(name).deleteOne({ _id: objectId });

  if (result.deletedCount === 0) {
    throw new AppError("Document not found", 404);
  }

  return successResponse(res, "Document deleted successfully", {
    deletedCount: result.deletedCount,
  });
});

// ---------------------------------------------------------------------------
// 6. GET /export/:name
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Bulk: POST /collections/:name/documents/bulk-insert — insertMany
// ---------------------------------------------------------------------------
export const bulkInsertDocuments = asyncHandler(async (req, res) => {
  requireAdmin(req);
  const { name } = req.params;
  if (!isValidCollectionName(name)) throw new AppError("Invalid collection name", 400);
  const { documents } = req.body;
  if (!Array.isArray(documents) || documents.length === 0)
    throw new AppError("'documents' must be a non-empty array", 400);
  if (documents.length > 500)
    throw new AppError("Maximum 500 documents per bulk insert", 400);
  const db = mongoose.connection.db;
  const result = await db.collection(name).insertMany(documents, { ordered: false });
  return successResponse(res, `${result.insertedCount} document(s) inserted`, {
    insertedCount: result.insertedCount,
  });
});

// ---------------------------------------------------------------------------
// Bulk: DELETE /collections/:name/documents/bulk — deleteMany by ids[]
// ---------------------------------------------------------------------------
export const bulkDeleteDocuments = asyncHandler(async (req, res) => {
  requireAdmin(req);
  const { name } = req.params;
  if (!isValidCollectionName(name)) throw new AppError("Invalid collection name", 400);
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0)
    throw new AppError("'ids' must be a non-empty array", 400);
  const { ObjectId } = mongoose.Types;
  const objectIds = ids.map(id => {
    try { return new ObjectId(id); }
    catch { throw new AppError(`Invalid ID: ${id}`, 400); }
  });
  const db = mongoose.connection.db;
  const result = await db.collection(name).deleteMany({ _id: { $in: objectIds } });
  return successResponse(res, `${result.deletedCount} document(s) deleted`, {
    deletedCount: result.deletedCount,
  });
});

// ---------------------------------------------------------------------------
// Bulk: PATCH /collections/:name/documents/bulk-update — updateMany with $set patch
// ---------------------------------------------------------------------------
export const bulkUpdateDocuments = asyncHandler(async (req, res) => {
  requireAdmin(req);
  const { name } = req.params;
  if (!isValidCollectionName(name)) throw new AppError("Invalid collection name", 400);
  const { ids, patch } = req.body;
  if (!Array.isArray(ids) || ids.length === 0)
    throw new AppError("'ids' must be a non-empty array", 400);
  if (!patch || typeof patch !== "object" || Array.isArray(patch))
    throw new AppError("'patch' must be a JSON object", 400);
  const { _id, ...fields } = patch;
  if (Object.keys(fields).length === 0)
    throw new AppError("'patch' must contain at least one field", 400);
  const { ObjectId } = mongoose.Types;
  const objectIds = ids.map(id => {
    try { return new ObjectId(id); }
    catch { throw new AppError(`Invalid ID: ${id}`, 400); }
  });
  const db = mongoose.connection.db;
  const result = await db.collection(name).updateMany(
    { _id: { $in: objectIds } },
    { $set: fields }
  );
  return successResponse(res, `${result.modifiedCount} document(s) updated`, {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  });
});

// ---------------------------------------------------------------------------
// Bulk: DELETE /collections/bulk — drop multiple collections by name
// ---------------------------------------------------------------------------
export const bulkDropCollections = asyncHandler(async (req, res) => {
  requireAdmin(req);
  const { names } = req.body;
  if (!Array.isArray(names) || names.length === 0)
    throw new AppError("'names' must be a non-empty array", 400);

  const db = mongoose.connection.db;
  const dropped = [];
  const errors = [];

  for (const raw of names) {
    const name = String(raw).trim();
    if (!name) continue;
    if (!isValidCollectionName(name)) {
      errors.push({ name, error: "Invalid collection name" });
      continue;
    }
    try {
      await db.dropCollection(name);
      dropped.push(name);
    } catch (err) {
      errors.push({ name, error: err.message });
    }
  }

  return successResponse(res, `${dropped.length} collection(s) dropped`, { dropped, errors });
});

// ---------------------------------------------------------------------------
// Bulk: POST /collections/bulk-create — create multiple empty collections
// ---------------------------------------------------------------------------
export const bulkCreateCollections = asyncHandler(async (req, res) => {
  requireAdmin(req);
  const { names } = req.body;
  if (!Array.isArray(names) || names.length === 0)
    throw new AppError("'names' must be a non-empty array", 400);
  if (names.length > 20)
    throw new AppError("Maximum 20 collections per bulk create", 400);

  const db = mongoose.connection.db;
  const created = [];
  const errors = [];

  for (const raw of names) {
    const name = String(raw).trim();
    if (!name) continue;
    if (!isValidCollectionName(name)) {
      errors.push({ name, error: "Invalid name — use letters, digits, underscore, or dot only" });
      continue;
    }
    try {
      await db.createCollection(name);
      created.push(name);
    } catch (err) {
      // Collection already exists or other error
      errors.push({ name, error: err.message });
    }
  }

  return successResponse(res, `${created.length} collection(s) created`, { created, errors });
});

// ---------------------------------------------------------------------------
// 11. POST /aggregate — read-only aggregation pipeline
// ---------------------------------------------------------------------------
export const runAggregate = asyncHandler(async (req, res) => {
  requireAdmin(req);

  let { collection, pipeline } = req.body;

  if (!collection || !isValidCollectionName(collection)) {
    throw new AppError("Invalid or missing collection name", 400);
  }
  if (!Array.isArray(pipeline) || pipeline.length === 0) {
    throw new AppError("'pipeline' must be a non-empty array of stage objects", 400);
  }
  if (pipeline.length > 20) throw new AppError("Maximum 20 pipeline stages allowed", 400);

  // Block write stages
  const WRITE_STAGES = ["$out", "$merge"];
  for (const stage of pipeline) {
    const keys = Object.keys(stage);
    if (keys.some((k) => WRITE_STAGES.includes(k))) {
      throw new AppError(`Write stage '${keys[0]}' is not permitted`, 400);
    }
  }

  // Safeguard: append $limit 100 if none present
  const hasLimit = pipeline.some((s) => "$limit" in s);
  if (!hasLimit) pipeline = [...pipeline, { $limit: 100 }];

  const db = mongoose.connection.db;

  // Verify collection exists
  const all = await db.listCollections().toArray();
  if (!all.some((c) => c.name === collection)) {
    throw new AppError(`Collection '${collection}' not found`, 404);
  }

  const start = Date.now();
  const results = await db.collection(collection).aggregate(pipeline).toArray();
  const executionTimeMs = Date.now() - start;

  return successResponse(res, "Aggregation executed", {
    collection,
    count: results.length,
    executionTimeMs,
    results,
  });
});

// ---------------------------------------------------------------------------
// 12. POST /collections/:name/indexes — create an index
// ---------------------------------------------------------------------------
export const createIndex = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const { name } = req.params;
  if (!isValidCollectionName(name)) throw new AppError("Invalid collection name", 400);

  const { keys, options = {} } = req.body;
  if (!keys || typeof keys !== "object" || Array.isArray(keys)) {
    throw new AppError("'keys' must be a JSON object, e.g. { \"fieldName\": 1 }", 400);
  }

  // Strip unsafe option keys
  const { background, ...safeOptions } = options;

  const db = mongoose.connection.db;
  const indexName = await db.collection(name).createIndex(keys, safeOptions);

  return successResponse(res, `Index '${indexName}' created successfully`, { indexName });
});

// ---------------------------------------------------------------------------
// 13. DELETE /collections/:name/indexes/:indexName — drop an index
// ---------------------------------------------------------------------------
export const dropIndex = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const { name, indexName } = req.params;
  if (!isValidCollectionName(name)) throw new AppError("Invalid collection name", 400);
  if (indexName === "_id_") throw new AppError("Cannot drop the default _id index", 400);

  const db = mongoose.connection.db;
  await db.collection(name).dropIndex(indexName);

  return successResponse(res, `Index '${indexName}' dropped successfully`, { indexName });
});

// ---------------------------------------------------------------------------
// 14. GET /collections/:name/schema — infer schema from up to 100 sample docs
// ---------------------------------------------------------------------------
export const inferSchema = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const { name } = req.params;
  if (!isValidCollectionName(name)) throw new AppError("Invalid collection name", 400);

  const db = mongoose.connection.db;
  const sample = await db.collection(name).find({}).limit(100).toArray();

  if (sample.length === 0) {
    return successResponse(res, "Schema inferred", { fields: [], sampleSize: 0 });
  }

  // Accumulate field → type info
  const fieldMap = {};
  for (const doc of sample) {
    for (const [key, val] of Object.entries(doc)) {
      if (!fieldMap[key]) {
        fieldMap[key] = { name: key, types: {}, presentIn: 0, nullCount: 0 };
      }
      fieldMap[key].presentIn++;
      if (val === null || val === undefined) {
        fieldMap[key].nullCount++;
      } else {
        const type =
          Array.isArray(val)           ? "array"
          : val instanceof Date        ? "date"
          : val?._bsontype === "ObjectId" ? "ObjectId"
          : typeof val === "object"    ? "object"
          : typeof val;
        fieldMap[key].types[type] = (fieldMap[key].types[type] || 0) + 1;
      }
    }
  }

  const fields = Object.values(fieldMap)
    .map((f) => ({
      name: f.name,
      types: f.types,
      presence: Math.round((f.presentIn / sample.length) * 100),
      nullCount: f.nullCount,
      dominantType:
        Object.entries(f.types).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "null",
    }))
    .sort((a, b) => b.presence - a.presence);

  return successResponse(res, "Schema inferred", { fields, sampleSize: sample.length });
});

// ---------------------------------------------------------------------------
// 15. POST /import/:name — import JSON array into collection (max 1000 docs)
// ---------------------------------------------------------------------------
export const importCollection = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const { name } = req.params;
  if (!isValidCollectionName(name)) throw new AppError("Invalid collection name", 400);

  const { documents, upsert = false } = req.body;
  if (!Array.isArray(documents) || documents.length === 0) {
    throw new AppError("'documents' must be a non-empty array", 400);
  }
  if (documents.length > 1000) {
    throw new AppError("Maximum 1,000 documents per import", 400);
  }

  const db = mongoose.connection.db;

  let insertedCount = 0;
  let skippedCount  = 0;
  const errors      = [];

  if (upsert) {
    const { ObjectId } = mongoose.Types;
    for (const doc of documents) {
      try {
        const filter = doc._id ? { _id: new ObjectId(String(doc._id)) } : { _id: new ObjectId() };
        const { _id, ...fields } = doc;
        await db.collection(name).updateOne(filter, { $set: fields }, { upsert: true });
        insertedCount++;
      } catch (err) {
        skippedCount++;
        errors.push(err.message);
      }
    }
  } else {
    try {
      // Strip _id to let MongoDB assign fresh IDs
      const clean = documents.map(({ _id, ...rest }) => rest);
      const result = await db.collection(name).insertMany(clean, { ordered: false });
      insertedCount = result.insertedCount;
    } catch (err) {
      // Partial success possible with ordered:false
      insertedCount = err.result?.insertedCount ?? 0;
      skippedCount  = documents.length - insertedCount;
      if (insertedCount === 0) throw new AppError(err.message, 400);
    }
  }

  return successResponse(res, `Import complete — ${insertedCount} inserted, ${skippedCount} skipped`, {
    insertedCount,
    skippedCount,
    errors: errors.slice(0, 10),
  });
});

export const exportCollection = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const { name } = req.params;

  if (!isValidCollectionName(name)) {
    throw new AppError(
      "Invalid collection name. Only alphanumeric characters, underscores, and dots are allowed.",
      400
    );
  }

  const docs = await mongoose.connection.db
    .collection(name)
    .find({})
    .limit(1000)
    .toArray();

  res.setHeader("Content-Type", "application/json");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${name}_export_${Date.now()}.json"`
  );

  res.json(docs);
});
