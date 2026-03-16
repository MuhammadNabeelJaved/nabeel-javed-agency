/**
 * Message & Conversation routes.
 *
 * Base paths:
 *  /api/v1/conversations  – conversation management
 *  /api/v1/messages       – message CRUD within conversations
 */
import express from "express";
import {
    createConversation,
    getMyConversations,
    getConversationById,
    updateConversation,
    deleteConversation,
    addMember,
    removeMember,
    sendMessage,
    getMessages,
    editMessage,
    deleteMessage,
    markConversationRead,
} from "../../controllers/usersControllers/message.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";
import upload from "../../middlewares/multer.js";

const conversationRouter = express.Router();
const messageRouter = express.Router();

// ─── Conversations ────────────────────────────────────────────────────────────

// All conversation routes require authentication
conversationRouter.use(userAuthenticated);

conversationRouter
    .route("/")
    .get(getMyConversations)
    .post(authorizeRoles("admin", "team", "user"), createConversation);

conversationRouter
    .route("/:id")
    .get(getConversationById)
    .patch(updateConversation)
    .delete(authorizeRoles("admin"), deleteConversation);

conversationRouter
    .route("/:id/members")
    .post(authorizeRoles("admin", "team"), addMember);

conversationRouter
    .route("/:id/members/:userId")
    .delete(authorizeRoles("admin", "team"), removeMember);

// ─── Messages ─────────────────────────────────────────────────────────────────

messageRouter.use(userAuthenticated);

messageRouter
    .route("/")
    .post(authorizeRoles("admin", "team", "user"), upload.array("attachments", 5), sendMessage);

messageRouter
    .route("/:conversationId")
    .get(getMessages);

messageRouter
    .route("/:conversationId/read")
    .patch(markConversationRead);

messageRouter
    .route("/msg/:id")
    .patch(editMessage)
    .delete(deleteMessage);

export { conversationRouter, messageRouter };
