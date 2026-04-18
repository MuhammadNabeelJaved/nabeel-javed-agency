import express from "express";
import {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    deleteProject,
    updateProjectStatus,
    getPublicPortfolio,
    getHomeFeatured,
    bulkDeleteProjects,
    bulkToggleVisibility,
    toggleFeaturedHome,
    uploadGalleryImages,
    deleteGalleryImage,
} from "../../controllers/usersControllers/adminProject.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";
import { mutationLimiter } from "../../middlewares/rateLimiter.js";
import { mongoIdParam, validate } from "../../middlewares/validate.js";
import { setCacheHeaders, noCache } from "../../middlewares/cacheHeaders.js";
import { cacheMiddleware } from "../../middlewares/redisCache.js";
import upload from "../../middlewares/multer.js";

const router = express.Router();

// Public routes – no auth required
router.get("/portfolio", setCacheHeaders(300), cacheMiddleware(300), getPublicPortfolio);
// Home-featured: always fresh — explicit no-store prevents any browser/CDN caching
router.get("/home-featured", noCache, getHomeFeatured);
// Single public project detail (used by /portfolio/:slug page)
router.get("/public/:id", validate([mongoIdParam("id")]), getProjectById);

// Read routes – admin + team can access
router.get("/", userAuthenticated, authorizeRoles("admin", "team"), getAllProjects);
router.get("/:id", userAuthenticated, authorizeRoles("admin", "team"), validate([mongoIdParam("id")]), getProjectById);

// Bulk routes – must come before /:id param routes
router.delete("/bulk", userAuthenticated, authorizeRoles("admin"), mutationLimiter, bulkDeleteProjects);
router.patch("/bulk/visibility", userAuthenticated, authorizeRoles("admin"), mutationLimiter, bulkToggleVisibility);

// Write routes – admin only
router.post("/", userAuthenticated, authorizeRoles("admin"), mutationLimiter, createProject);
router.put("/:id", userAuthenticated, authorizeRoles("admin"), mutationLimiter, validate([mongoIdParam("id")]), updateProject);
router.patch("/:id/status", userAuthenticated, authorizeRoles("admin", "team"), mutationLimiter, validate([mongoIdParam("id")]), updateProjectStatus);
router.patch("/:id/featured-home", userAuthenticated, authorizeRoles("admin"), mutationLimiter, validate([mongoIdParam("id")]), toggleFeaturedHome);
router.delete("/:id", userAuthenticated, authorizeRoles("admin"), mutationLimiter, validate([mongoIdParam("id")]), deleteProject);

// Gallery image routes
router.post("/:id/images", userAuthenticated, authorizeRoles("admin"), mutationLimiter, validate([mongoIdParam("id")]), upload.array('images', 10), uploadGalleryImages);
router.delete("/:id/images/:imageId", userAuthenticated, authorizeRoles("admin"), mutationLimiter, deleteGalleryImage);

export default router;
