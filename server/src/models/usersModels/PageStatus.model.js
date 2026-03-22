import mongoose from "mongoose";

/**
 * PageStatus model
 * Tracks the visibility status of each public-facing page.
 * Managed by admin; read publicly (no auth required).
 */
const pageStatusSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        label: {
            type: String,
            required: true,
        },
        path: {
            type: String,
            required: true,
        },
        matchPrefix: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: ["active", "maintenance", "coming-soon"],
            default: "active",
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

export default mongoose.model("PageStatus", pageStatusSchema);
