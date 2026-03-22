import asyncHandler from "../../middlewares/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import PageStatus from "../../models/usersModels/PageStatus.model.js";

// Default page registry — used to auto-init if DB is empty
export const PAGE_REGISTRY = [
    // ── Public Pages ──────────────────────────────────────────────────────────
    { key: "home",      label: "Home",      path: "/",          matchPrefix: false, category: "public" },
    { key: "services",  label: "Services",  path: "/services",  matchPrefix: true,  category: "public" },
    { key: "portfolio", label: "Portfolio", path: "/portfolio", matchPrefix: true,  category: "public" },
    { key: "contact",   label: "Contact",   path: "/contact",   matchPrefix: true,  category: "public" },
    { key: "our-team",  label: "Our Team",  path: "/our-team",  matchPrefix: false, category: "public" },
    { key: "careers",   label: "Careers",   path: "/careers",   matchPrefix: true,  category: "public" },

    // ── Admin Dashboard Pages ─────────────────────────────────────────────────
    { key: "admin-dashboard",       label: "Dashboard",              path: "/admin",                      matchPrefix: false, category: "admin" },
    { key: "admin-messages",        label: "Messages",               path: "/admin/messages",             matchPrefix: false, category: "admin" },
    { key: "admin-projects",        label: "Portfolio Projects",     path: "/admin/projects",             matchPrefix: false, category: "admin" },
    { key: "admin-services",        label: "Services Management",    path: "/admin/services",             matchPrefix: true,  category: "admin" },
    { key: "admin-team",            label: "Team Management",        path: "/admin/team",                 matchPrefix: false, category: "admin" },
    { key: "admin-clients",         label: "Client Management",      path: "/admin/clients",              matchPrefix: false, category: "admin" },
    { key: "admin-client-requests", label: "Client Requests",        path: "/admin/client-requests",      matchPrefix: false, category: "admin" },
    { key: "admin-contacts",        label: "Contact Messages",       path: "/admin/contacts",             matchPrefix: false, category: "admin" },
    { key: "admin-jobs",            label: "Job Management",         path: "/admin/jobs",                 matchPrefix: false, category: "admin" },
    { key: "admin-job-applications",label: "Job Applications",       path: "/admin/job-applications",     matchPrefix: false, category: "admin" },
    { key: "admin-database",        label: "Database Manager",       path: "/admin/database",             matchPrefix: false, category: "admin" },
    { key: "admin-content-editor",  label: "Content Editor",         path: "/admin/content-editor",       matchPrefix: false, category: "admin" },
    { key: "admin-page-manager",    label: "Page Manager",           path: "/admin/page-manager",         matchPrefix: false, category: "admin" },
    { key: "admin-settings",        label: "Settings",               path: "/admin/settings",             matchPrefix: false, category: "admin" },

    // ── User Dashboard Pages ───────────────────────────────────────────────────
    { key: "user-dashboard",        label: "User Overview",          path: "/user-dashboard",             matchPrefix: false, category: "user" },
    { key: "user-projects",         label: "My Projects",            path: "/user-dashboard/projects",    matchPrefix: false, category: "user" },
    { key: "user-applied-jobs",     label: "Applied Jobs",           path: "/user-dashboard/applied-jobs",matchPrefix: false, category: "user" },
    { key: "user-messages",         label: "Messages",               path: "/user-dashboard/messages",    matchPrefix: false, category: "user" },
    { key: "user-ai-assistant",     label: "AI Assistant",           path: "/user-dashboard/ai-assistant",matchPrefix: false, category: "user" },
    { key: "user-notifications",    label: "Notifications",          path: "/user-dashboard/notifications",matchPrefix: false, category: "user" },
    { key: "user-profile",          label: "Profile",                path: "/user-dashboard/profile",     matchPrefix: false, category: "user" },

    // ── Team Dashboard Pages ───────────────────────────────────────────────────
    { key: "team-dashboard",        label: "Team Overview",          path: "/team",                       matchPrefix: false, category: "team" },
    { key: "team-projects",         label: "Projects",               path: "/team/projects",              matchPrefix: true,  category: "team" },
    { key: "team-tasks",            label: "Tasks",                  path: "/team/tasks",                 matchPrefix: false, category: "team" },
    { key: "team-reports",          label: "Reports",                path: "/team/reports",               matchPrefix: false, category: "team" },
    { key: "team-calendar",         label: "Calendar",               path: "/team/calendar",              matchPrefix: false, category: "team" },
    { key: "team-chat",             label: "Team Chat",              path: "/team/chat",                  matchPrefix: false, category: "team" },
    { key: "team-resources",        label: "Resources",              path: "/team/resources",             matchPrefix: false, category: "team" },
    { key: "team-notifications",    label: "Notifications",          path: "/team/notifications",         matchPrefix: false, category: "team" },
    { key: "team-settings",         label: "Settings",               path: "/team/settings",              matchPrefix: false, category: "team" },
];

/**
 * GET /api/v1/page-status  — public
 * Returns all page statuses. Auto-seeds defaults if none exist.
 * Also upserts any new registry entries not yet in DB (handles migrations).
 */
export const getAllPageStatuses = asyncHandler(async (req, res) => {
    let pages = await PageStatus.find().lean();

    if (pages.length === 0) {
        // Fresh install — seed all registry pages
        await PageStatus.insertMany(PAGE_REGISTRY.map(p => ({ ...p, status: "active" })));
    } else {
        const existingKeys = new Set(pages.map(p => p.key));

        // Migrate old "team" key → "our-team" FIRST (before checking missing keys)
        if (existingKeys.has("team") && !existingKeys.has("our-team")) {
            await PageStatus.updateOne(
                { key: "team" },
                { $set: { key: "our-team", label: "Our Team", path: "/our-team", category: "public" } }
            );
            existingKeys.add("our-team");
            existingKeys.delete("team");
        }

        // Sync any new registry pages not yet in DB (migration support)
        const missing = PAGE_REGISTRY.filter(p => !existingKeys.has(p.key));
        if (missing.length > 0) {
            await PageStatus.insertMany(missing.map(p => ({ ...p, status: "active" })));
        }

        // Backfill category field on existing docs that don't have it
        const registryMap = new Map(PAGE_REGISTRY.map(p => [p.key, p]));
        const needsCategory = pages.filter(p => !p.category && p.key !== "team" && registryMap.has(p.key));
        if (needsCategory.length > 0) {
            await Promise.all(
                needsCategory.map(p =>
                    PageStatus.updateOne({ key: p.key }, { $set: { category: registryMap.get(p.key).category || "public" } })
                )
            );
        }
    }

    pages = await PageStatus.find().sort({ category: 1, key: 1 }).lean();
    successResponse(res, "Page statuses fetched", pages);
});

/**
 * PUT /api/v1/page-status/:key  — admin only
 * Updates the status and/or isHidden flag of a single page.
 */
export const updatePageStatus = asyncHandler(async (req, res) => {
    const { key } = req.params;
    const { status, isHidden } = req.body;

    const updateFields = { updatedBy: req.user._id };

    if (status !== undefined) {
        if (!["active", "maintenance", "coming-soon"].includes(status)) {
            throw new AppError('status must be "active", "maintenance", or "coming-soon"', 400);
        }
        updateFields.status = status;
    }

    if (isHidden !== undefined) {
        updateFields.isHidden = !!isHidden;
    }

    if (Object.keys(updateFields).length === 1) {
        throw new AppError("Provide status or isHidden to update", 400);
    }

    const page = await PageStatus.findOneAndUpdate(
        { key },
        { $set: updateFields },
        { new: true, upsert: true }
    );

    successResponse(res, `Page "${page.label}" updated`, page);
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
