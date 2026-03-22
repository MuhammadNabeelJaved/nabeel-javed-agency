import express from "express";
import {
    getActiveAnnouncements,
    getAllAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
} from "../../controllers/usersControllers/announcement.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";

const router = express.Router();

// Public — only active announcements for the bar
router.get("/", getActiveAnnouncements);

// Admin only
router.get("/all", userAuthenticated, authorizeRoles("admin"), getAllAnnouncements);
router.post("/", userAuthenticated, authorizeRoles("admin"), createAnnouncement);
router.put("/:id", userAuthenticated, authorizeRoles("admin"), updateAnnouncement);
router.delete("/:id", userAuthenticated, authorizeRoles("admin"), deleteAnnouncement);

export default router;
