/**
 * Resource controller – team file & folder management.
 *
 * Supports files (uploaded to Cloudinary), folders (logical grouping),
 * and external links (e.g. Figma, Google Drive).
 */
import asyncHandler from "../../middlewares/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";
import Resource from "../../models/usersModels/Resource.model.js";
import { uploadImage, deleteImage } from "../../middlewares/Cloudinary.js";

// ─── Upload / Create Resource ─────────────────────────────────────────────────

/**
 * POST /api/v1/resources
 * Create a folder, upload a file, or save an external link.
 *
 * Body (folder) : { type: "folder", name, parentFolder?, workspace?, project? }
 * Body (link)   : { type: "link",   name, url, parentFolder?, workspace?, project? }
 * File (file)   : multipart/form-data with field "file" + { name?, parentFolder?, workspace?, project? }
 */
export const createResource = asyncHandler(async (req, res) => {
    const { type = "file", name, url, parentFolder, workspace = "team", project } = req.body;

    if (!["folder", "file", "link"].includes(type)) {
        throw new AppError("type must be 'folder', 'file', or 'link'", 400);
    }

    if (!name?.trim() && type !== "file") {
        throw new AppError("Name is required", 400);
    }
    if (type === "link" && !url?.trim()) {
        throw new AppError("URL is required for link type", 400);
    }

    const resourceData = {
        type,
        name: name?.trim(),
        workspace,
        uploadedBy: req.user._id,
        parentFolder: parentFolder || null,
        project: project || undefined,
    };

    if (type === "folder") {
        const resource = await Resource.create(resourceData);
        return successResponse(res, "Folder created", resource, 201);
    }

    if (type === "link") {
        resourceData.url = url.trim();
        const resource = await Resource.create(resourceData);
        return successResponse(res, "Link saved", resource, 201);
    }

    // type === "file"
    if (!req.file) throw new AppError("File is required for file type", 400);

    const result = await uploadImage(req.file.path, "resources");

    resourceData.name = name?.trim() || req.file.originalname;
    resourceData.url = result.secure_url;
    resourceData.publicId = result.public_id;
    resourceData.mimeType = req.file.mimetype;
    resourceData.fileSize = req.file.size;

    const resource = await Resource.create(resourceData);

    // Update parent folder item count
    if (parentFolder) {
        await Resource.findByIdAndUpdate(parentFolder, { $inc: { itemCount: 1 } });
    }

    return successResponse(res, "File uploaded", resource, 201);
});

// ─── List Resources ───────────────────────────────────────────────────────────

/**
 * GET /api/v1/resources
 * List resources (root level or inside a folder).
 * Query: workspace=team|client, parentFolder=id|null, type, project, search, page, limit
 */
export const getResources = asyncHandler(async (req, res) => {
    const {
        workspace = "team",
        parentFolder,
        type,
        project,
        search,
        page = 1,
        limit = 50,
    } = req.query;

    const filter = { workspace };

    // If parentFolder not specified, return root items (parentFolder: null)
    filter.parentFolder = parentFolder || null;

    if (type) filter.type = type;
    if (project) filter.project = project;

    if (search) {
        filter.name = { $regex: search, $options: "i" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [resources, total] = await Promise.all([
        Resource.find(filter)
            .populate("uploadedBy", "name photo")
            .sort({ type: 1, name: 1, createdAt: -1 }) // folders first
            .skip(skip)
            .limit(parseInt(limit))
            .lean(),
        Resource.countDocuments(filter),
    ]);

    return successResponse(res, "Resources fetched", {
        resources,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
        },
    });
});

// ─── Get Single Resource ──────────────────────────────────────────────────────

/**
 * GET /api/v1/resources/:id
 */
export const getResourceById = asyncHandler(async (req, res) => {
    const resource = await Resource.findById(req.params.id)
        .populate("uploadedBy", "name photo")
        .populate("parentFolder", "name");

    if (!resource) throw new AppError("Resource not found", 404);

    return successResponse(res, "Resource fetched", resource);
});

// ─── Update Resource ──────────────────────────────────────────────────────────

/**
 * PATCH /api/v1/resources/:id
 * Rename or move a resource (owner or admin).
 * Body: { name?, parentFolder? }
 */
export const updateResource = asyncHandler(async (req, res) => {
    const resource = await Resource.findById(req.params.id);
    if (!resource) throw new AppError("Resource not found", 404);

    const isOwner = resource.uploadedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) throw new AppError("Not authorized", 403);

    if (req.body.name !== undefined) resource.name = req.body.name.trim();
    if (req.body.parentFolder !== undefined) {
        const oldParent = resource.parentFolder;
        resource.parentFolder = req.body.parentFolder || null;
        // Update item counts
        if (oldParent) {
            await Resource.findByIdAndUpdate(oldParent, { $inc: { itemCount: -1 } });
        }
        if (resource.parentFolder) {
            await Resource.findByIdAndUpdate(resource.parentFolder, { $inc: { itemCount: 1 } });
        }
    }

    await resource.save();
    return successResponse(res, "Resource updated", resource);
});

// ─── Delete Resource ──────────────────────────────────────────────────────────

/**
 * DELETE /api/v1/resources/:id
 * Delete a resource and its Cloudinary file (owner or admin).
 */
export const deleteResource = asyncHandler(async (req, res) => {
    const resource = await Resource.findById(req.params.id);
    if (!resource) throw new AppError("Resource not found", 404);

    const isOwner = resource.uploadedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) throw new AppError("Not authorized", 403);

    // Delete from Cloudinary if it was a file upload
    if (resource.type === "file" && resource.publicId) {
        try {
            await deleteImage(resource.url, "resources");
        } catch {
            // Continue even if Cloudinary delete fails
        }
    }

    // Update parent folder count
    if (resource.parentFolder) {
        await Resource.findByIdAndUpdate(resource.parentFolder, {
            $inc: { itemCount: -1 },
        });
    }

    // If deleting a folder, also delete its children
    if (resource.type === "folder") {
        await Resource.deleteMany({ parentFolder: resource._id });
    }

    await resource.deleteOne();
    return successResponse(res, "Resource deleted");
});
