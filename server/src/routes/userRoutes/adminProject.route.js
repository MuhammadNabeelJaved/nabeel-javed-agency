import express from "express";
import {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    deleteProject,
    updateProjectStatus,
    getPublicPortfolio,
} from "../../controllers/usersControllers/adminProject.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";
import { mutationLimiter } from "../../middlewares/rateLimiter.js";
import { mongoIdParam, validate } from "../../middlewares/validate.js";

const router = express.Router();

// Public route – portfolio page
router.get("/portfolio", getPublicPortfolio);

// Read routes – admin + team can access
router.get("/", userAuthenticated, authorizeRoles("admin", "team"), getAllProjects);
router.get("/:id", userAuthenticated, authorizeRoles("admin", "team"), validate([mongoIdParam("id")]), getProjectById);

// Write routes – admin only
router.post("/", userAuthenticated, authorizeRoles("admin"), mutationLimiter, createProject);
router.put("/:id", userAuthenticated, authorizeRoles("admin"), mutationLimiter, validate([mongoIdParam("id")]), updateProject);
router.patch("/:id/status", userAuthenticated, authorizeRoles("admin", "team"), mutationLimiter, validate([mongoIdParam("id")]), updateProjectStatus);
router.delete("/:id", userAuthenticated, authorizeRoles("admin"), mutationLimiter, validate([mongoIdParam("id")]), deleteProject);

export default router;
