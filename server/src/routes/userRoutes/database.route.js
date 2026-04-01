import express from "express";
import { userAuthenticated } from "../../middlewares/Auth.js";
import {
  getDbStats,
  getCollections,
  getCollectionDetail,
  getDocuments,
  getInsights,
  executeQuery,
  exportCollection,
  insertDocument,
  updateDocument,
  deleteDocument,
  bulkInsertDocuments,
  bulkDeleteDocuments,
  bulkUpdateDocuments,
  bulkCreateCollections,
  bulkDropCollections,
} from "../../controllers/usersControllers/database.controller.js";

const router = express.Router();

// All database-manager routes require a valid JWT
router.use(userAuthenticated);

router.get("/stats", getDbStats);
router.get("/collections", getCollections);
router.post("/collections/bulk-create", bulkCreateCollections);
router.delete("/collections/bulk", bulkDropCollections);
router.get("/collections/:name", getCollectionDetail);
router.get("/collections/:name/documents", getDocuments);
// Bulk routes — before /:id param routes
router.post("/collections/:name/documents/bulk-insert", bulkInsertDocuments);
router.delete("/collections/:name/documents/bulk", bulkDeleteDocuments);
router.patch("/collections/:name/documents/bulk-update", bulkUpdateDocuments);
// Single-doc routes
router.post("/collections/:name/documents", insertDocument);
router.put("/collections/:name/documents/:id", updateDocument);
router.delete("/collections/:name/documents/:id", deleteDocument);
router.get("/insights", getInsights);
router.post("/query", executeQuery);
router.get("/export/:name", exportCollection);

export default router;
