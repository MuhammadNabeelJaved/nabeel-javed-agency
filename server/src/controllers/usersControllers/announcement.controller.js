import asyncHandler from "../../middlewares/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import Announcement from "../../models/usersModels/Announcement.model.js";

/** GET /api/v1/announcements — public, only active */
export const getActiveAnnouncements = asyncHandler(async (req, res) => {
    const items = await Announcement.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    successResponse(res, "Announcements fetched", items);
});

/** GET /api/v1/announcements/all — admin, all including inactive */
export const getAllAnnouncements = asyncHandler(async (req, res) => {
    const items = await Announcement.find().sort({ order: 1, createdAt: -1 });
    successResponse(res, "All announcements fetched", items);
});

/** POST /api/v1/announcements — admin */
export const createAnnouncement = asyncHandler(async (req, res) => {
    const { text, emoji, link, linkLabel, bgColor, textColor, isActive, order } = req.body;
    if (!text?.trim()) throw new AppError("text is required", 400);

    const item = await Announcement.create({
        text: text.trim(),
        emoji: emoji?.trim() || "",
        link: link?.trim() || "",
        linkLabel: linkLabel?.trim() || "Learn More",
        bgColor: bgColor || "#7c3aed",
        textColor: textColor || "#ffffff",
        isActive: isActive !== undefined ? isActive : true,
        order: order ?? 0,
        createdBy: req.user._id,
    });

    successResponse(res, "Announcement created", item, 201);
});

/** PUT /api/v1/announcements/:id — admin */
export const updateAnnouncement = asyncHandler(async (req, res) => {
    const allowed = ["text", "emoji", "link", "linkLabel", "bgColor", "textColor", "isActive", "order"];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const item = await Announcement.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
    });
    if (!item) throw new AppError("Announcement not found", 404);

    successResponse(res, "Announcement updated", item);
});

/** DELETE /api/v1/announcements/:id — admin */
export const deleteAnnouncement = asyncHandler(async (req, res) => {
    const item = await Announcement.findByIdAndDelete(req.params.id);
    if (!item) throw new AppError("Announcement not found", 404);
    successResponse(res, "Announcement deleted", {});
});
