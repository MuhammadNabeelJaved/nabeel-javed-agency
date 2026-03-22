import mongoose from "mongoose";

/**
 * Announcement model
 * Manages the infinite scrolling announcement bar at the top of the website.
 * Admin creates/edits/deletes; public GET returns only active ones.
 */
const announcementSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: [true, "Announcement text is required"],
            trim: true,
            maxlength: [300, "Text must be 300 characters or less"],
        },
        emoji: {
            type: String,
            default: "",
            trim: true,
        },
        link: {
            type: String,
            default: "",
            trim: true,
        },
        linkLabel: {
            type: String,
            default: "Learn More",
            trim: true,
        },
        bgColor: {
            type: String,
            default: "#7c3aed",
        },
        textColor: {
            type: String,
            default: "#ffffff",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        order: {
            type: Number,
            default: 0,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

export default mongoose.model("Announcement", announcementSchema);
