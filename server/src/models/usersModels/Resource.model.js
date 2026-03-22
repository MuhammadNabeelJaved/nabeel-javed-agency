/**
 * Resource model – stores file metadata for team shared resources.
 * Actual files are stored on Cloudinary; this keeps the metadata.
 */
import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        originalName: {
            type: String,
            required: true,
        },
        url: {
            type: String,       // Cloudinary secure_url
            required: true,
        },
        publicId: {
            type: String,       // Cloudinary public_id (needed for deletion)
            required: true,
        },
        mimeType: {
            type: String,
            default: "application/octet-stream",
        },
        size: {
            type: Number,       // bytes
            default: 0,
        },
        resourceType: {
            type: String,       // 'image' | 'raw' | 'video' | 'auto'
            default: "raw",
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

const Resource = mongoose.model("Resource", resourceSchema);
export default Resource;
