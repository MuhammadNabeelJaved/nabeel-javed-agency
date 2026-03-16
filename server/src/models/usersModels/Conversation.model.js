/**
 * Conversation model – chat threads for team channels and direct messages.
 *
 * Supports two workspace contexts:
 *  - "team"   : Team workspace (TEAMDASH) — channels + team DMs
 *  - "client" : Client workspace — client-to-admin/support messaging
 *
 * Two conversation types:
 *  - "channel" : Named group channel (e.g. #general, #design-team)
 *  - "direct"  : One-on-one private message between two users
 *
 * Endpoints:
 *  - POST   /api/v1/conversations                – create or get existing DM / create channel
 *  - GET    /api/v1/conversations                – list my conversations
 *  - GET    /api/v1/conversations/:id            – get single conversation
 *  - PATCH  /api/v1/conversations/:id            – update channel name/description (admin)
 *  - DELETE /api/v1/conversations/:id            – delete conversation (admin)
 *  - POST   /api/v1/conversations/:id/members    – add member to channel
 *  - DELETE /api/v1/conversations/:id/members/:userId – remove member from channel
 */
import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
    {
        // "team" conversations appear in TEAMDASH; "client" in the User Dashboard
        workspace: {
            type: String,
            enum: ["team", "client"],
            required: true,
            index: true,
        },

        // channel = named group; direct = 1-on-1
        type: {
            type: String,
            enum: ["channel", "direct"],
            required: true,
        },

        // Channel-only fields
        name: {
            type: String,
            trim: true,
            maxlength: [80, "Channel name cannot exceed 80 characters"],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [300, "Description cannot exceed 300 characters"],
        },
        topic: {
            type: String,
            trim: true,
            maxlength: [200, "Topic cannot exceed 200 characters"],
        },

        // All participants (both channels and direct messages)
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        // Who created this conversation / channel
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        // Denormalised last message for conversation list previews
        lastMessage: {
            content: { type: String, trim: true },
            sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            sentAt: { type: Date },
        },

        // Unread count per participant: { userId: count }
        unreadCounts: {
            type: Map,
            of: Number,
            default: {},
        },

        // Soft archive — channel still exists but is hidden from sidebar
        isArchived: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Unique index for direct conversations — prevents duplicates between same two users
// For direct convos sort participant IDs so order doesn't matter
conversationSchema.index(
    { workspace: 1, type: 1, participants: 1 },
    { name: "conversation_participants_idx" }
);

// ─── Static Methods ───────────────────────────────────────────────────────────

/**
 * Finds an existing direct conversation between two users in a workspace,
 * or creates a new one.
 */
conversationSchema.statics.findOrCreateDirect = async function (
    userId1,
    userId2,
    workspace = "team"
) {
    const sorted = [userId1, userId2].map(String).sort();
    let convo = await this.findOne({
        workspace,
        type: "direct",
        participants: { $all: sorted, $size: 2 },
    });

    if (!convo) {
        convo = await this.create({
            workspace,
            type: "direct",
            participants: sorted,
            createdBy: userId1,
        });
    }
    return convo;
};

const Conversation =
    mongoose.models.Conversation ||
    mongoose.model("Conversation", conversationSchema);

export default Conversation;
