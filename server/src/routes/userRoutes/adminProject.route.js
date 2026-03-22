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

const router = express.Router();

// Public route – portfolio page
router.get("/portfolio", getPublicPortfolio);

// Read routes – admin + team can access
router.get("/", userAuthenticated, authorizeRoles("admin", "team"), getAllProjects);
router.get("/:id", userAuthenticated, authorizeRoles("admin", "team"), getProjectById);

// Write routes – admin only
router.post("/", userAuthenticated, authorizeRoles("admin"), createProject);
router.put("/:id", userAuthenticated, authorizeRoles("admin"), updateProject);
router.patch("/:id/status", userAuthenticated, authorizeRoles("admin", "team"), updateProjectStatus);
router.delete("/:id", userAuthenticated, authorizeRoles("admin"), deleteProject);

export default router;
