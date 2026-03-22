import asyncHandler from "../../middlewares/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import PageStatus from "../../models/usersModels/PageStatus.model.js";

// Default page registry — used to auto-init if DB is empty
export const PAGE_REGISTRY = [
    { key: "home",      label: "Home",      path: "/",          matchPrefix: false },
    { key: "services",  label: "Services",  path: "/services",  matchPrefix: true  },
    { key: "portfolio", label: "Portfolio", path: "/portfolio", matchPrefix: true  },
    { key: "contact",   label: "Contact",   path: "/contact",   matchPrefix: true  },
    { key: "team",      label: "Our Team",  path: "/our-team",  matchPrefix: false },
    { key: "careers",   label: "Careers",   path: "/careers",   matchPrefix: true  },
];

/**
 * GET /api/v1/page-status  — public
 * Returns all page statuses. Auto-seeds defaults if none exist.
 */
export const getAllPageStatuses = asyncHandler(async (req, res) => {
    let pages = await PageStatus.find().sort({ key: 1 }).lean();

    if (pages.length === 0) {
        await PageStatus.insertMany(PAGE_REGISTRY);
        pages = await PageStatus.find().sort({ key: 1 }).lean();
    }

    successResponse(res, "Page statuses fetched", pages);
});

/**
 * PUT /api/v1/page-status/:key  — admin only
 * Updates the status of a single page.
 */
export const updatePageStatus = asyncHandler(async (req, res) => {
    const { key } = req.params;
    const { status } = req.body;

    if (!["active", "maintenance", "coming-soon"].includes(status)) {
        throw new AppError('status must be "active", "maintenance", or "coming-soon"', 400);
    }

    const page = await PageStatus.findOneAndUpdate(
        { key },
        { status, updatedBy: req.user._id },
        { new: true, upsert: true }
    );

    successResponse(res, `Page "${page.label}" updated to ${status}`, page);
});

/**
 * POST /api/v1/page-status  — admin only
 * Creates a custom page entry.
 */
export const createPageStatus = asyncHandler(async (req, res) => {
    const { label, path, matchPrefix, status } = req.body;

    if (!label || !path) {
        throw new AppError("label and path are required", 400);
    }

    // Generate a unique key from the path (strip leading slash, replace / with -)
    const key = "custom-" + path.replace(/^\/+/, "").replace(/\//g, "-").replace(/[^a-z0-9-]/gi, "").toLowerCase() || `custom-${Date.now()}`;

    const existing = await PageStatus.findOne({ key });
    if (existing) throw new AppError("A page with this path already exists", 409);

    const page = await PageStatus.create({
        key,
        label: label.trim(),
        path: path.startsWith("/") ? path.trim() : `/${path.trim()}`,
        matchPrefix: !!matchPrefix,
        status: status || "coming-soon",
        updatedBy: req.user._id,
        isCustom: true,
    });

    successResponse(res, "Custom page created", page, 201);
});

/**
 * DELETE /api/v1/page-status/:key  — admin only
 * Deletes a custom page entry (built-in pages cannot be deleted).
 */
export const deletePageStatus = asyncHandler(async (req, res) => {
    const { key } = req.params;

    const builtInKeys = PAGE_REGISTRY.map(p => p.key);
    if (builtInKeys.includes(key)) {
        throw new AppError("Built-in pages cannot be deleted", 400);
    }

    const page = await PageStatus.findOneAndDelete({ key });
    if (!page) throw new AppError("Page not found", 404);

    successResponse(res, "Custom page deleted", {});
});
