import express from "express";
import {
    submitApplication,
    getAllApplications,
    getApplicationsByJob,
    getApplicationById,
    updateApplicationStatus,
    deleteApplication,
    getApplicationStats,
} from "../../controllers/usersControllers/jobApplication.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";

const router = express.Router();

// Public – applicants submit
router.post("/", submitApplication);

// Admin only
router.use(userAuthenticated, authorizeRoles("admin"));

router.get("/", getAllApplications);
router.get("/stats", getApplicationStats);
router.get("/job/:jobId", getApplicationsByJob);
router.get("/:id", getApplicationById);
router.patch("/:id/status", updateApplicationStatus);
router.delete("/:id", deleteApplication);

export default router;
