import asyncHandler from "../../middlewares/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import AnnouncementBar from "../../models/usersModels/AnnouncementBar.model.js";
import Announcement from "../../models/usersModels/Announcement.model.js";

/** Auto-seed: create default bar and migrate existing announcements if no bars exist */
async function ensureDefaultBar() {
    const count = await AnnouncementBar.countDocuments();
    if (count > 0) return;
    // Create default bar
    const defaultBar = await AnnouncementBar.create({ name: "Main Bar", order: 0 });
    // Migrate all existing announcements (barId: null) to this default bar
    await Announcement.updateMany(
        { _meta: { $ne: true }, barId: null },
        { $set: { barId: defaultBar._id } }
    );
}

/** GET /api/v1/announcements/bars — public, returns active PUBLIC bars with their active announcements */
export const getActiveBars = asyncHandler(async (req, res) => {
    await ensureDefaultBar();
    // Only bars visible on public pages (visibility = 'public' or 'both'; legacy docs without field default to 'public')
    const bars = await AnnouncementBar.find({
        isActive: true,
        $or: [
            { visibility: { $in: ['public', 'both'] } },
            { visibility: { $exists: false } }, // legacy docs before the field was added
        ],
    }).sort({ order: 1, createdAt: 1 }).lean();

    const result = await Promise.all(
        bars.map(async (bar) => {
            const items = await Announcement.find({
                barId: bar._id,
                isActive: true,
                _meta: { $ne: true },
            })
                .sort({ order: 1, createdAt: -1 })
                .lean();
            return { bar, items };
        })
    );
    const filtered = result.filter(r => r.items.length > 0);
    successResponse(res, "Active bars fetched", filtered);
});

/** GET /api/v1/announcements/bars/dashboard — authenticated, returns active DASHBOARD bars */
export const getActiveDashboardBars = asyncHandler(async (req, res) => {
    const bars = await AnnouncementBar.find({
        isActive: true,
        visibility: { $in: ['dashboard', 'both'] },
    }).sort({ order: 1, createdAt: 1 }).lean();

    const result = await Promise.all(
        bars.map(async (bar) => {
            const items = await Announcement.find({
                barId: bar._id,
                isActive: true,
                _meta: { $ne: true },
            })
                .sort({ order: 1, createdAt: -1 })
                .lean();
            return { bar, items };
        })
    );
    const filtered = result.filter(r => r.items.length > 0);
    successResponse(res, "Active dashboard bars fetched", filtered);
});

/** GET /api/v1/announcements/bars/all — admin, all bars with all their announcements */
export const getAllBars = asyncHandler(async (req, res) => {
    await ensureDefaultBar();
    const bars = await AnnouncementBar.find().sort({ order: 1, createdAt: 1 }).lean();
    const result = await Promise.all(
        bars.map(async (bar) => {
            const items = await Announcement.find({
                barId: bar._id,
                _meta: { $ne: true },
            })
                .sort({ order: 1, createdAt: -1 })
                .lean();
            return { bar, items };
        })
    );
    successResponse(res, "All bars fetched", result);
});

/** POST /api/v1/announcements/bars — admin, create a new bar */
export const createBar = asyncHandler(async (req, res) => {
    const { name, bgColor, textColor, scrollEnabled, tickerDuration, textAlign, separatorVisible, separatorColor, itemSpacing, order, visibility } = req.body;
    if (!name?.trim()) throw new AppError("name is required", 400);

    const validVisibility = ['public', 'dashboard', 'both'];
    const bar = await AnnouncementBar.create({
        name: name.trim(),
        bgColor: bgColor || "#7c3aed",
        textColor: textColor || "#ffffff",
        scrollEnabled: scrollEnabled !== undefined ? Boolean(scrollEnabled) : true,
        tickerDuration: tickerDuration ? Math.min(Math.max(Number(tickerDuration), 5), 120) : 30,
        textAlign: textAlign || "center",
        separatorVisible: separatorVisible !== undefined ? Boolean(separatorVisible) : true,
        separatorColor: separatorColor || "",
        itemSpacing: itemSpacing ? Math.min(Math.max(Number(itemSpacing), 0), 128) : 32,
        order: order ?? 0,
        visibility: validVisibility.includes(visibility) ? visibility : 'public',
        createdBy: req.user._id,
    });

    successResponse(res, "Bar created", bar, 201);
});

/** PUT /api/v1/announcements/bars/:id — admin, update bar settings */
export const updateBar = asyncHandler(async (req, res) => {
    const allowed = [
        "name", "bgColor", "textColor", "scrollEnabled", "tickerDuration", "textAlign",
        "separatorVisible", "separatorColor", "itemSpacing", "order", "isActive", "visibility",
    ];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (updates.tickerDuration) updates.tickerDuration = Math.min(Math.max(Number(updates.tickerDuration), 5), 120);
    if (updates.itemSpacing !== undefined) updates.itemSpacing = Math.min(Math.max(Number(updates.itemSpacing), 0), 128);

    const bar = await AnnouncementBar.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!bar) throw new AppError("Bar not found", 404);
    successResponse(res, "Bar updated", bar);
});

/** DELETE /api/v1/announcements/bars/:id — admin, delete bar and its announcements */
export const deleteBar = asyncHandler(async (req, res) => {
    const bar = await AnnouncementBar.findById(req.params.id);
    if (!bar) throw new AppError("Bar not found", 404);
    // Delete all announcements belonging to this bar
    await Announcement.deleteMany({ barId: bar._id });
    await AnnouncementBar.findByIdAndDelete(req.params.id);
    successResponse(res, "Bar and its announcements deleted", {});
});
