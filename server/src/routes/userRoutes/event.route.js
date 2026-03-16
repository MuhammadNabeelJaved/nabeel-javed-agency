/**
 * Event routes – /api/v1/events
 */
import express from "express";
import {
    createEvent,
    getAllEvents,
    getMyEvents,
    getEventById,
    updateEvent,
    deleteEvent,
} from "../../controllers/usersControllers/event.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";

const router = express.Router();

router.use(userAuthenticated, authorizeRoles("admin", "team"));

router.get("/my", getMyEvents);
router.get("/", getAllEvents);
router.post("/", createEvent);

router.get("/:id", getEventById);
router.patch("/:id", updateEvent);
router.delete("/:id", deleteEvent);

export default router;
