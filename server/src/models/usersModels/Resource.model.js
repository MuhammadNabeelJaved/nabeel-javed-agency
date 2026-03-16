/**
 * Resource model – shared team files, folders, and external links.
 *
 * The TEAMDASH Resources page shows:
 *  - Folders (Brand Guidelines, Project Assets, Legal Documents)
 *  - Individual files (PDFs, images)
 *  - External links (Design System Figma)
 *
 * Endpoints:
 *  - POST   /api/v1/resources           – upload / create resource (team/admin)
 *  - GET    /api/v1/resources           – list resources (optional folder filter)
 *  - GET    /api/v1/resources/:id       – get single resource
 *  - PATCH  /api/v1/resources/:id       – rename / update resource (owner/admin)
 *  - DELETE /api/v1/resources/:id       – delete resource (owner/admin)
 */
import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Resource name is required"],
            trim: true,
            maxlength: [200, "Name cannot exceed 200 characters"],
        },

        // type of resource
        type: {
            type: String,
            enum: ["folder", "file", "link"],
            required: true,
            index: true,
        },

        // URL for files (Cloudinary) or external links
        url: {
            type: String,
            trim: true,
        },

        // Cloudinary public_id (for deletion)
        publicId: {
            type: String,
            trim: true,
        },

        // MIME type / extension for display icon
        mimeType: {
            type: String,
            trim: true,
        },

        // Human-readable size (e.g. "2.4 MB")
        fileSize: {
            type: Number, // bytes
        },

        // Optional parent folder (null = root level)
        parentFolder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Resource",
            default: null,
            index: true,
        },

        // Number of items inside a folder (denormalised for performance)
        itemCount: {
            type: Number,
            default: 0,
        },

        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Optional project this resource belongs to
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AdminProject",
            index: true,
        },

        // Workspace: team resources vs client-shared resources
        workspace: {
            type: String,
            enum: ["team", "client"],
            default: "team",
            index: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

resourceSchema.index({ workspace: 1, parentFolder: 1, createdAt: -1 });

const Resource =
    mongoose.models.Resource || mongoose.model("Resource", resourceSchema);

export default Resource;
