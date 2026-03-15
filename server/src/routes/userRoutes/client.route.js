import express from "express";
import {
    createClient,
    getAllClients,
    getClientById,
    updateClient,
    deleteClient,
    getClientStats,
} from "../../controllers/usersControllers/client.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";

const router = express.Router();

// All client routes are admin-only
router.use(userAuthenticated, authorizeRoles("admin"));

router.get("/stats", getClientStats);
router.get("/", getAllClients);
router.get("/:id", getClientById);
router.post("/", createClient);
router.put("/:id", updateClient);
router.delete("/:id", deleteClient);

export default router;
