/**
 * Message & Conversation controller.
 *
 * Handles:
 *  - Conversation management (create channel / open DM / list / update / delete)
 *  - Message CRUD within a conversation (send / list / edit / delete / mark read)
 *  - File attachment upload via Cloudinary
 *
 * Role access:
 *  - team / admin : full team workspace (channels + DMs)
 *  - user         : client workspace (DMs with admin/support only)
 */
import asyncHandler from "../../middlewares/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";
import Conversation from "../../models/usersModels/Conversation.model.js";
import Message from "../../models/usersModels/Message.model.js";
import { uploadImage, deleteImage } from "../../middlewares/Cloudinary.js";

// ─── Helper ───────────────────────────────────────────────────────────────────

const getFileType = (mimetype = "") => {
    if (mimetype.startsWith("image/")) return "image";
    if (mimetype.startsWith("video/")) return "video";
    if (mimetype.startsWith("audio/")) return "audio";
    return "document";
};

// ─── Conversation Controllers ─────────────────────────────────────────────────

/**
 * POST /api/v1/conversations
 * Create a channel (admin/team) or open a direct conversation.
 *
 * Body for channel  : { type: "channel", name, description?, workspace? }
 * Body for direct   : { type: "direct", recipientId, workspace? }
 */
export const createConversation = asyncHandler(async (req, res) => {
    const { type, name, description, recipientId, workspace = "team" } = req.body;
    const userId = req.user._id;

    if (!type || !["channel", "direct"].includes(type)) {
        throw new AppError("type must be 'channel' or 'direct'", 400);
    }

    let conversation;

    if (type === "direct") {
        if (!recipientId) throw new AppError("recipientId is required for direct messages", 400);
        if (recipientId.toString() === userId.toString()) {
            throw new AppError("Cannot create a conversation with yourself", 400);
        }
        conversation = await Conversation.findOrCreateDirect(userId, recipientId, workspace);
    } else {
        // Channel
        if (!name || !name.trim()) throw new AppError("Channel name is required", 400);

        conversation = await Conversation.create({
            workspace,
            type: "channel",
            name: name.trim(),
            description: description?.trim(),
            participants: [userId],
            createdBy: userId,
        });
    }

    const populatedConversation = await Conversation.findById(conversation._id)
        .populate("participants", "name photo teamProfile.position role");

    return successResponse(res, "Conversation ready", populatedConversation, 201);
});

/**
 * GET /api/v1/conversations
 * List conversations the current user participates in.
 * Query: workspace=team|client
 */
export const getMyConversations = asyncHandler(async (req, res) => {
    const { workspace = "team" } = req.query;
    const userId = req.user._id;

    const conversations = await Conversation.find({
        workspace,
        participants: userId,
        isArchived: false,
    })
        .populate("participants", "name photo teamProfile.position role")
        .populate("lastMessage.sender", "name photo")
        .sort({ "lastMessage.sentAt": -1, updatedAt: -1 })
        .lean();

    return successResponse(res, "Conversations fetched", conversations);
});

/**
 * GET /api/v1/conversations/:id
 * Get a single conversation by ID (must be a participant).
 */
export const getConversationById = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
        _id: req.params.id,
        participants: userId,
    })
        .populate("participants", "name photo teamProfile.position role")
        .populate("createdBy", "name photo");

    if (!conversation) throw new AppError("Conversation not found", 404);

    return successResponse(res, "Conversation fetched", conversation);
});

/**
 * PATCH /api/v1/conversations/:id
 * Update a channel name/description (admin or creator).
 */
export const updateConversation = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) throw new AppError("Conversation not found", 404);

    const isAdmin = req.user.role === "admin";
    const isCreator = conversation.createdBy?.toString() === userId.toString();
    if (!isAdmin && !isCreator) {
        throw new AppError("Not authorized to update this conversation", 403);
    }

    const { name, description, topic } = req.body;
    if (name !== undefined) conversation.name = name.trim();
    if (description !== undefined) conversation.description = description.trim();
    if (topic !== undefined) conversation.topic = topic.trim();

    await conversation.save();
    return successResponse(res, "Conversation updated", conversation);
});

/**
 * DELETE /api/v1/conversations/:id
 * Archive (soft-delete) a conversation (admin only).
 */
export const deleteConversation = asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") {
        throw new AppError("Only admins can delete conversations", 403);
    }

    const conversation = await Conversation.findByIdAndUpdate(
        req.params.id,
        { isArchived: true },
        { new: true }
    );
    if (!conversation) throw new AppError("Conversation not found", 404);

    return successResponse(res, "Conversation archived");
});

/**
 * POST /api/v1/conversations/:id/members
 * Add a user to a channel.
 * Body: { userId }
 */
export const addMember = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    if (!userId) throw new AppError("userId is required", 400);

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) throw new AppError("Conversation not found", 404);
    if (conversation.type !== "channel") {
        throw new AppError("Can only add members to channels", 400);
    }

    if (!conversation.participants.map(String).includes(userId.toString())) {
        conversation.participants.push(userId);
        await conversation.save();
    }

    await conversation.populate("participants", "name photo teamProfile.position role");
    return successResponse(res, "Member added", conversation);
});

/**
 * DELETE /api/v1/conversations/:id/members/:userId
 * Remove a user from a channel.
 */
export const removeMember = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) throw new AppError("Conversation not found", 404);
    if (conversation.type !== "channel") {
        throw new AppError("Can only remove members from channels", 400);
    }

    conversation.participants = conversation.participants.filter(
        (p) => p.toString() !== userId.toString()
    );
    await conversation.save();
    return successResponse(res, "Member removed");
});

// ─── Message Controllers ──────────────────────────────────────────────────────

/**
 * POST /api/v1/messages
 * Send a message to a conversation.
 * Body: { conversationId, content?, replyTo? }
 * Files: optional (multipart/form-data) — field name "attachments"
 */
export const sendMessage = asyncHandler(async (req, res) => {
    const { conversationId, content, replyTo } = req.body;
    const userId = req.user._id;

    if (!conversationId) throw new AppError("conversationId is required", 400);

    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
    });
    if (!conversation) throw new AppError("Conversation not found or access denied", 404);

    // Handle file uploads
    const attachments = [];
    if (req.files && req.files.length > 0) {
        for (const file of req.files) {
            try {
                const result = await uploadImage(file.path, "messages");
                attachments.push({
                    fileName: file.originalname,
                    fileUrl: result.secure_url,
                    fileType: getFileType(file.mimetype),
                    fileSize: file.size,
                    publicId: result.public_id,
                });
            } catch {
                // Continue even if one file fails
            }
        }
    }

    if (!content?.trim() && attachments.length === 0) {
        throw new AppError("Message must have content or attachments", 400);
    }

    const messageType = attachments.length > 0 && !content?.trim() ? "file" : "text";

    const message = await Message.create({
        conversation: conversationId,
        sender: userId,
        content: content?.trim(),
        type: messageType,
        attachments,
        replyTo: replyTo || undefined,
        readBy: [{ user: userId, readAt: new Date() }],
    });

    // Update conversation's lastMessage snapshot
    conversation.lastMessage = {
        content: content?.trim() || `[${attachments.length} file(s)]`,
        sender: userId,
        sentAt: new Date(),
    };
    // Increment unread counts for other participants
    for (const participantId of conversation.participants) {
        if (participantId.toString() !== userId.toString()) {
            const current = conversation.unreadCounts.get(participantId.toString()) || 0;
            conversation.unreadCounts.set(participantId.toString(), current + 1);
        }
    }
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
        .populate("sender", "name photo teamProfile.position role")
        .populate("replyTo", "content sender");

    return successResponse(res, "Message sent", populatedMessage, 201);
});

/**
 * GET /api/v1/messages/:conversationId
 * Get messages in a conversation (paginated, newest first).
 * Query: page=1, limit=50
 */
export const getMessages = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;

    // Verify the user is a participant
    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
    });
    if (!conversation) throw new AppError("Conversation not found or access denied", 404);

    const [messages, total] = await Promise.all([
        Message.find({ conversation: conversationId, isDeleted: false })
            .populate("sender", "name photo teamProfile.position role")
            .populate("replyTo", "content sender")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Message.countDocuments({ conversation: conversationId, isDeleted: false }),
    ]);

    return successResponse(res, "Messages fetched", {
        messages: messages.reverse(), // return chronological order
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
});

/**
 * PATCH /api/v1/messages/:id
 * Edit a message (sender only, within 15 minutes).
 * Body: { content }
 */
export const editMessage = asyncHandler(async (req, res) => {
    const { content } = req.body;
    if (!content?.trim()) throw new AppError("Content is required", 400);

    const message = await Message.findById(req.params.id);
    if (!message) throw new AppError("Message not found", 404);

    if (message.sender.toString() !== req.user._id.toString()) {
        throw new AppError("You can only edit your own messages", 403);
    }

    // Allow edits within 15 minutes
    const fifteenMinutes = 15 * 60 * 1000;
    if (Date.now() - message.createdAt.getTime() > fifteenMinutes) {
        throw new AppError("Messages can only be edited within 15 minutes of sending", 400);
    }

    message.content = content.trim();
    message.isEdited = true;
    await message.save();

    await message.populate("sender", "name photo teamProfile.position role");
    return successResponse(res, "Message updated", message);
});

/**
 * DELETE /api/v1/messages/:id
 * Soft-delete a message (sender or admin).
 */
export const deleteMessage = asyncHandler(async (req, res) => {
    const message = await Message.findById(req.params.id);
    if (!message) throw new AppError("Message not found", 404);

    const isSender = message.sender.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isSender && !isAdmin) {
        throw new AppError("Not authorized to delete this message", 403);
    }

    message.isDeleted = true;
    message.content = "This message was deleted";
    message.attachments = [];
    await message.save();

    return successResponse(res, "Message deleted");
});

/**
 * PATCH /api/v1/messages/:conversationId/read
 * Mark all messages in a conversation as read for the current user.
 */
export const markConversationRead = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Mark all unread messages in the conversation as read by this user
    await Message.updateMany(
        {
            conversation: conversationId,
            isDeleted: false,
            "readBy.user": { $ne: userId },
        },
        {
            $push: { readBy: { user: userId, readAt: new Date() } },
        }
    );

    // Reset unread count for this user in the conversation
    await Conversation.findByIdAndUpdate(conversationId, {
        $unset: { [`unreadCounts.${userId}`]: "" },
    });

    return successResponse(res, "Conversation marked as read");
});
