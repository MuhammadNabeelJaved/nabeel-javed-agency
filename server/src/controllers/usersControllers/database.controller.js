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
