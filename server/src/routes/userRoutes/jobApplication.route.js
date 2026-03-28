import express from "express";
import {
    submitApplication,
    getAllApplications,
    getApplicationsByJob,
    getApplicationById,
    updateApplicationStatus,
    deleteApplication,
    getApplicationStats,
    getMyApplications,
} from "../../controllers/usersControllers/jobApplication.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";
import uploadAny from "../../middlewares/multerAny.js";
import { uploadLimiter, mutationLimiter } from "../../middlewares/rateLimiter.js";
import { jobApplicationSchema, mongoIdParam, validate } from "../../middlewares/validate.js";

const router = express.Router();

// Public – applicants submit (resume upload optional)
router.post("/", uploadLimiter, uploadAny.single("resume"), jobApplicationSchema, submitApplication);

// Authenticated user – see their own applications
router.get("/my", userAuthenticated, getMyApplications);

// Admin only
router.use(userAuthenticated, authorizeRoles("admin"));

router.get("/", getAllApplications);
router.get("/stats", getApplicationStats);
router.get("/job/:jobId", getApplicationsByJob);
router.get("/:id", validate([mongoIdParam("id")]), getApplicationById);
router.patch("/:id/status", mutationLimiter, validate([mongoIdParam("id")]), updateApplicationStatus);
router.delete("/:id", mutationLimiter, validate([mongoIdParam("id")]), deleteApplication);

export default router;
