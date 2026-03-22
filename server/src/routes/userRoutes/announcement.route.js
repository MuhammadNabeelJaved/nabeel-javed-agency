import express from "express";
import {
    getActiveAnnouncements,
    getAllAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    getSettings,
    updateSettings,
} from "../../controllers/usersControllers/announcement.controller.js";
import {
    getActiveBars,
    getAllBars,
    createBar,
    updateBar,
    deleteBar,
} from "../../controllers/usersControllers/announcementBar.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";

const router = express.Router();

// ── Bar routes (must come BEFORE /:id to avoid conflicts) ──────────────────

// Public
router.get("/bars", getActiveBars);

// Admin only
router.get("/bars/all", userAuthenticated, authorizeRoles("admin"), getAllBars);
router.post("/bars", userAuthenticated, authorizeRoles("admin"), createBar);
router.put("/bars/:id", userAuthenticated, authorizeRoles("admin"), updateBar);
router.delete("/bars/:id", userAuthenticated, authorizeRoles("admin"), deleteBar);

// ── Announcement routes ────────────────────────────────────────────────────

// Public
router.get("/", getActiveAnnouncements);
router.get("/settings", getSettings);

// Admin only
router.get("/all", userAuthenticated, authorizeRoles("admin"), getAllAnnouncements);
router.put("/settings", userAuthenticated, authorizeRoles("admin"), updateSettings);
router.post("/", userAuthenticated, authorizeRoles("admin"), createAnnouncement);
router.put("/:id", userAuthenticated, authorizeRoles("admin"), updateAnnouncement);
router.delete("/:id", userAuthenticated, authorizeRoles("admin"), deleteAnnouncement);

export default router;
