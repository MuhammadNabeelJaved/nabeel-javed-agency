/**
 * Resource controller – upload/list/delete shared team files via Cloudinary.
 */
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
import asyncHandler from "../../middlewares/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";
import Resource from "../../models/usersModels/Resource.model.js";

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/resources
 * Body: multipart/form-data  field: "file"
 * Optional body field: "name" (display name, defaults to original filename)
 */
export const uploadResource = asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError("No file provided", 400);

    const localPath = req.file.path;

    let result;
    try {
        result = await cloudinary.uploader.upload(localPath, {
            folder:        "team-resources",
            resource_type: "auto",          // handles image, pdf, docx, zip, etc.
            use_filename:  true,
            unique_filename: true,
        });
    } finally {
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    }

    if (!result?.secure_url) throw new AppError("Cloudinary upload failed", 500);

    const resource = await Resource.create({
        name:         req.body.name?.trim() || req.file.originalname,
        originalName: req.file.originalname,
        url:          result.secure_url,
        publicId:     result.public_id,
        mimeType:     req.file.mimetype,
        size:         req.file.size,
        resourceType: result.resource_type,
        uploadedBy:   req.user._id,
    });

    const populated = await resource.populate("uploadedBy", "name photo");

    return successResponse(res, "File uploaded", populated, 201);
});

// ─── Get All ─────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/resources
 */
export const getAllResources = asyncHandler(async (req, res) => {
    const resources = await Resource.find()
        .populate("uploadedBy", "name photo")
        .sort({ createdAt: -1 })
        .lean();

    return successResponse(res, "Resources fetched", resources);
});

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * DELETE /api/v1/resources/:id
 * Only admin or the uploader can delete.
 */
export const deleteResource = asyncHandler(async (req, res) => {
    const resource = await Resource.findById(req.params.id);
    if (!resource) throw new AppError("Resource not found", 404);

    // Only admin or uploader
    const isOwner = resource.uploadedBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
        throw new AppError("Not authorised to delete this resource", 403);
    }

    // Delete from Cloudinary
    // resource_type must be 'image', 'video', or 'raw'
    const cdnType = ["image", "video"].includes(resource.resourceType)
        ? resource.resourceType
        : "raw";
    try {
        await cloudinary.uploader.destroy(resource.publicId, { resource_type: cdnType });
    } catch {
        // Non-fatal – still remove DB record
    }

    await resource.deleteOne();

    const io = req.app.get("io");
    if (io) io.of("/public").emit("cms:updated", { section: "resources" });
    return successResponse(res, "Resource deleted");
});

// ─── Bulk Delete Resources ────────────────────────────────────────────────────
export const bulkDeleteResources = asyncHandler(async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) throw new AppError("ids array is required", 400);

    const resources = await Resource.find({ _id: { $in: ids } });

    // Delete from Cloudinary (best-effort, non-fatal)
    await Promise.allSettled(resources.map(r => {
        if (!r.publicId) return Promise.resolve();
        const cdnType = r.resourceType === "video" ? "video"
            : r.resourceType === "raw" ? "raw" : "image";
        return cloudinary.uploader.destroy(r.publicId, { resource_type: cdnType });
    }));

    const result = await Resource.deleteMany({ _id: { $in: ids } });
    const io = req.app.get("io");
    if (io) io.of("/public").emit("cms:updated", { section: "resources" });
    return successResponse(res, `${result.deletedCount} resource(s) deleted`, { deletedCount: result.deletedCount });
});
