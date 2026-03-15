import express from "express";
import {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    sendNotification,
    getAllNotifications,
} from "../../controllers/usersControllers/notification.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";

const router = express.Router();

// All notification routes require authentication
router.use(userAuthenticated);

// User routes – own notifications
router.get("/my", getMyNotifications);
router.patch("/my/read-all", markAllAsRead);
router.delete("/my/clear-all", clearAllNotifications);
router.patch("/my/:id/read", markAsRead);
router.delete("/my/:id", deleteNotification);

// Admin routes
router.get("/", authorizeRoles("admin"), getAllNotifications);
router.post("/send", authorizeRoles("admin"), sendNotification);

export default router;
