/**
 * Task routes – /api/v1/tasks
 */
import express from "express";
import {
    createTask,
    getAllTasks,
    getMyTasks,
    getTaskById,
    updateTask,
    updateTaskStatus,
    deleteTask,
    getTaskStats,
} from "../../controllers/usersControllers/task.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";

const router = express.Router();

router.use(userAuthenticated);

router.get("/stats", authorizeRoles("admin", "team"), getTaskStats);
router.get("/my", getMyTasks);

router.get("/", authorizeRoles("admin", "team"), getAllTasks);
router.post("/", authorizeRoles("admin", "team"), createTask);

router.get("/:id", getTaskById);
router.patch("/:id", updateTask);
router.delete("/:id", authorizeRoles("admin", "team"), deleteTask);

router.patch("/:id/status", updateTaskStatus);

export default router;
