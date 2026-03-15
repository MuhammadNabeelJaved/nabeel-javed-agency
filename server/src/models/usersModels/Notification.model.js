import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        // Recipient
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // Type of notification (drives icon/colour on frontend)
        type: {
            type: String,
            enum: [
                "project_update",     // project status changed
                "project_milestone",  // milestone reached
                "new_message",        // new message from admin/team
                "payment_received",   // payment confirmed
                "payment_due",        // payment overdue
                "review_requested",   // admin asks for review
                "job_application",    // application status updated
                "system",             // platform announcements
            ],
            required: true,
            index: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: [150, "Title cannot exceed 150 characters"],
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: [500, "Message cannot exceed 500 characters"],
        },

        // Optional deep-link data
        link: {
            type: String,
            trim: true,
        },
        // Reference to related document (project, message, review, etc.)
        relatedId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        relatedModel: {
            type: String,
            trim: true, // e.g. "Project", "Review"
        },

        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Static: create and send to a user
notificationSchema.statics.notify = async function (recipientId, type, title, message, extras = {}) {
    return this.create({ recipient: recipientId, type, title, message, ...extras });
};

// Static: mark all as read for a user
notificationSchema.statics.markAllRead = function (userId) {
    return this.updateMany({ recipient: userId, isRead: false }, { isRead: true });
};

const Notification =
    mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

export default Notification;
