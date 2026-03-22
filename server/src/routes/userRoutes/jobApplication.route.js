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

const router = express.Router();

// Public – applicants submit
router.post("/", submitApplication);

// Authenticated user – see their own applications
router.get("/my", userAuthenticated, getMyApplications);

// Admin only
router.use(userAuthenticated, authorizeRoles("admin"));

router.get("/", getAllApplications);
router.get("/stats", getApplicationStats);
router.get("/job/:jobId", getApplicationsByJob);
router.get("/:id", getApplicationById);
router.patch("/:id/status", updateApplicationStatus);
router.delete("/:id", deleteApplication);

export default router;
