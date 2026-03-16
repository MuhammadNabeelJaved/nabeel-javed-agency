/**
 * Message model – individual messages inside a Conversation.
 *
 * Supports text messages, file/image attachments, and system messages.
 * Read receipts are tracked via the `readBy` array.
 *
 * Endpoints (under /api/v1/messages):
 *  - POST   /api/v1/messages                     – send a message
 *  - GET    /api/v1/messages/:conversationId      – get messages in a conversation (paginated)
 *  - PATCH  /api/v1/messages/:id                 – edit own message
 *  - DELETE /api/v1/messages/:id                 – delete own message (soft)
 *  - PATCH  /api/v1/messages/:conversationId/read – mark conversation messages as read
 */
import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
    {
        fileName: { type: String, required: true, trim: true },
        fileUrl: { type: String, required: true, trim: true },
        fileType: {
            type: String,
            enum: ["image", "document", "video", "audio", "other"],
            default: "other",
        },
        fileSize: { type: Number }, // bytes
        publicId: { type: String, trim: true }, // Cloudinary public_id for deletion
    },
    { _id: false }
);

const messageSchema = new mongoose.Schema(
    {
        // The conversation this message belongs to
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
            index: true,
        },

        // Who sent the message
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Message body — optional when sending only attachments
        content: {
            type: String,
            trim: true,
            maxlength: [4000, "Message cannot exceed 4000 characters"],
        },

        // Message type
        type: {
            type: String,
            enum: ["text", "file", "system"],
            default: "text",
        },

        // File/image attachments
        attachments: [attachmentSchema],

        // Users who have read this message
        readBy: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                readAt: { type: Date, default: Date.now },
            },
        ],

        // If this is a reply to another message
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },

        // Soft delete — message hidden but record preserved
        isDeleted: {
            type: Boolean,
            default: false,
        },

        // Edited flag
        isEdited: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Optimise "get messages in conversation, newest first"
messageSchema.index({ conversation: 1, createdAt: -1 });

// ─── Instance Methods ─────────────────────────────────────────────────────────

/**
 * Returns true if the given userId has already read this message.
 */
messageSchema.methods.isReadBy = function (userId) {
    return this.readBy.some((r) => r.user.toString() === userId.toString());
};

const Message =
    mongoose.models.Message || mongoose.model("Message", messageSchema);

export default Message;
