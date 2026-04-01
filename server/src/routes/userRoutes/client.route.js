import express from "express";
import {
    createClient,
    getAllClients,
    getClientById,
    updateClient,
    deleteClient,
    getClientStats,
    bulkDeleteClients,
} from "../../controllers/usersControllers/client.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";
import { mutationLimiter } from "../../middlewares/rateLimiter.js";
import { mongoIdParam, validate } from "../../middlewares/validate.js";

const router = express.Router();

// All client routes are admin-only
router.use(userAuthenticated, authorizeRoles("admin"));

router.get("/stats", getClientStats);
router.delete("/bulk", mutationLimiter, bulkDeleteClients);
router.get("/", getAllClients);
router.get("/:id", validate([mongoIdParam("id")]), getClientById);
router.post("/", mutationLimiter, createClient);
router.put("/:id", mutationLimiter, validate([mongoIdParam("id")]), updateClient);
router.delete("/:id", mutationLimiter, validate([mongoIdParam("id")]), deleteClient);

export default router;
