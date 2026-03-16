/**
 * Event controller – calendar event management for the TEAMDASH Calendar page.
 */
import asyncHandler from "../../middlewares/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";
import Event from "../../models/usersModels/Event.model.js";
import Notification from "../../models/usersModels/Notification.model.js";

// ─── Create Event ─────────────────────────────────────────────────────────────

/**
 * POST /api/v1/events
 * Body: { title, description?, type?, startDate, endDate?, allDay?, location?, color?, attendees?, project?, recurrence? }
 */
export const createEvent = asyncHandler(async (req, res) => {
    const {
        title, description, type, startDate, endDate,
        allDay, location, color, attendees, project, recurrence,
    } = req.body;

    if (!title?.trim()) throw new AppError("Event title is required", 400);
    if (!startDate) throw new AppError("Start date is required", 400);

    const event = await Event.create({
        title: title.trim(),
        description: description?.trim(),
        type: type || "meeting",
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        allDay: allDay || false,
        location: location?.trim(),
        color: color || "purple",
        attendees: attendees || [],
        project: project || undefined,
        recurrence: recurrence || "none",
        createdBy: req.user._id,
    });

    // Notify attendees
    if (attendees?.length > 0) {
        const notifyPromises = attendees
            .filter((id) => id.toString() !== req.user._id.toString())
            .map((attendeeId) =>
                Notification.notify(
                    attendeeId,
                    "project_update",
                    "Event Invitation",
                    `You've been invited to: "${event.title}"`,
                    { relatedId: event._id, relatedModel: "Event" }
                )
            );
        await Promise.allSettled(notifyPromises);
    }

    await event.populate([
        { path: "attendees", select: "name photo teamProfile.position" },
        { path: "createdBy", select: "name photo" },
        { path: "project", select: "projectTitle" },
    ]);

    return successResponse(res, "Event created", event, 201);
});

// ─── List Events ──────────────────────────────────────────────────────────────

/**
 * GET /api/v1/events
 * Query: startDate, endDate, type, page, limit
 * Returns events within a date range (defaults to current month).
 */
export const getAllEvents = asyncHandler(async (req, res) => {
    const { type, page = 1, limit = 100 } = req.query;

    // Default: current month
    const now = new Date();
    const startDate = req.query.startDate
        ? new Date(req.query.startDate)
        : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = req.query.endDate
        ? new Date(req.query.endDate)
        : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const filter = {
        startDate: { $lte: endDate },
        $or: [{ endDate: { $gte: startDate } }, { endDate: null }],
    };
    if (type) filter.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [events, total] = await Promise.all([
        Event.find(filter)
            .populate("attendees", "name photo teamProfile.position")
            .populate("createdBy", "name photo")
            .populate("project", "projectTitle")
            .sort({ startDate: 1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean(),
        Event.countDocuments(filter),
    ]);

    return successResponse(res, "Events fetched", {
        events,
        pagination: { total, page: parseInt(page), limit: parseInt(limit) },
    });
});

// ─── Get My Events ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/events/my
 * Events where the current user is an attendee or creator.
 */
export const getMyEvents = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const events = await Event.find({
        $or: [{ attendees: userId }, { createdBy: userId }],
    })
        .populate("attendees", "name photo")
        .populate("createdBy", "name photo")
        .populate("project", "projectTitle")
        .sort({ startDate: 1 })
        .lean();

    return successResponse(res, "My events fetched", events);
});

// ─── Get Single Event ─────────────────────────────────────────────────────────

/**
 * GET /api/v1/events/:id
 */
export const getEventById = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id)
        .populate("attendees", "name photo teamProfile.position role")
        .populate("createdBy", "name photo")
        .populate("project", "projectTitle status");

    if (!event) throw new AppError("Event not found", 404);

    return successResponse(res, "Event fetched", event);
});

// ─── Update Event ─────────────────────────────────────────────────────────────

/**
 * PATCH /api/v1/events/:id
 * Update event details (creator or admin).
 */
export const updateEvent = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);
    if (!event) throw new AppError("Event not found", 404);

    const isAdmin = req.user.role === "admin";
    const isCreator = event.createdBy?.toString() === req.user._id.toString();
    if (!isAdmin && !isCreator) {
        throw new AppError("Not authorized to update this event", 403);
    }

    const allowed = [
        "title", "description", "type", "startDate", "endDate",
        "allDay", "location", "color", "attendees", "project", "recurrence",
    ];

    for (const key of allowed) {
        if (req.body[key] !== undefined) {
            event[key] = req.body[key];
        }
    }

    await event.save();

    await event.populate([
        { path: "attendees", select: "name photo teamProfile.position" },
        { path: "createdBy", select: "name photo" },
    ]);

    return successResponse(res, "Event updated", event);
});

// ─── Delete Event ─────────────────────────────────────────────────────────────

/**
 * DELETE /api/v1/events/:id
 * Delete event (creator or admin).
 */
export const deleteEvent = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);
    if (!event) throw new AppError("Event not found", 404);

    const isAdmin = req.user.role === "admin";
    const isCreator = event.createdBy?.toString() === req.user._id.toString();
    if (!isAdmin && !isCreator) {
        throw new AppError("Not authorized to delete this event", 403);
    }

    await event.deleteOne();
    return successResponse(res, "Event deleted");
});
