/**
 * Socket.IO Server
 *
 * Responsibilities:
 *  1. JWT authentication on every connection (reads from cookie or auth.token)
 *  2. Private room per user: "user:{userId}"
 *  3. Admins also join "admin:global" for broadcast events
 *  4. Conversation rooms: "conversation:{conversationId}"
 *  5. All chat events: send_message, typing, read_messages
 *  6. All notification events: unread count, mark_read, mark_all_read
 *  7. Optional Redis adapter for horizontal scaling (set REDIS_URL in .env)
 *
 * Room strategy:
 *  - "user:{id}"             → private; used for notification delivery
 *  - "admin:global"          → all admins; used for new support request alerts
 *  - "conversation:{id}"     → all participants in a thread; used for messages
 */
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/usersModels/User.model.js";
import Conversation from "../models/usersModels/Conversation.model.js";
import Message from "../models/usersModels/Message.model.js";
import Notification from "../models/usersModels/Notification.model.js";
import LiveChatSession from '../models/usersModels/LiveChatSession.model.js';
import LiveChatMessage from '../models/usersModels/LiveChatMessage.model.js';
import { notifyAdmins } from '../utils/notificationService.js';

// ─── Cookie helper ────────────────────────────────────────────────────────────
// Parse the raw "Cookie" header string without any external dependency.
function parseCookies(cookieStr = "") {
    return cookieStr.split(";").reduce((acc, pair) => {
        const idx = pair.indexOf("=");
        if (idx < 0) return acc;
        const key = pair.slice(0, idx).trim();
        const val = pair.slice(idx + 1).trim();
        acc[key] = decodeURIComponent(val);
        return acc;
    }, {});
}

// ─── File type helper ─────────────────────────────────────────────────────────
function detectFileType(mimeOrName = "") {
    const s = mimeOrName.toLowerCase();
    if (s.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|svg)$/.test(s)) return "image";
    if (s === "application/pdf" || s.endsWith(".pdf")) return "pdf";
    if (s.includes("word") || s.includes("document") || /\.(doc|docx)$/.test(s)) return "doc";
    return "other";
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function initSocket(httpServer, corsOptions) {
    const io = new Server(httpServer, {
        cors: corsOptions,
        // Allow both polling (fallback) and WebSocket transports
        transports: ["polling", "websocket"],
    });

    // ── Per-IP connection rate limit for /livechat namespace ─────────────────
    const _lcIpConnections = new Map(); // ip → { count, resetAt }
    const LC_MAX_CONNECTIONS = 10;
    const LC_WINDOW_MS = 60 * 1000; // 1 minute

    function _isLcRateLimited(ip) {
        const now = Date.now();
        const entry = _lcIpConnections.get(ip);
        if (!entry || now > entry.resetAt) {
            _lcIpConnections.set(ip, { count: 1, resetAt: now + LC_WINDOW_MS });
            return false;
        }
        entry.count++;
        return entry.count > LC_MAX_CONNECTIONS;
    }

    // ── Optional Redis adapter (horizontal scaling) ───────────────────────────
    if (process.env.REDIS_URL) {
        try {
            const { createClient } = await import("ioredis");
            const { createAdapter } = await import("@socket.io/redis-adapter");
            const pubClient = new createClient(process.env.REDIS_URL);
            const subClient = pubClient.duplicate();
            await Promise.all([pubClient.connect(), subClient.connect()]);
            io.adapter(createAdapter(pubClient, subClient));
            console.log("Socket.IO: Redis adapter connected");
        } catch (err) {
            console.warn("Socket.IO: Redis adapter failed — running single-node:", err.message);
        }
    }

    // ── JWT auth middleware ───────────────────────────────────────────────────
    io.use(async (socket, next) => {
        try {
            // Prefer HTTP-only cookie (browser sends automatically with withCredentials)
            const cookies = parseCookies(socket.handshake.headers.cookie);
            const token =
                cookies.accessToken ||
                socket.handshake.auth?.token;

            if (!token) {
                return next(new Error("Authentication required"));
            }

            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            const user = await User.findById(decoded.id).select("-password");

            if (!user) return next(new Error("User not found"));
            if (!user.isVerified) return next(new Error("Account not verified"));

            socket.user = user;
            next();
        } catch (err) {
            next(new Error(`Auth failed: ${err.message}`));
        }
    });

    // ── Public namespace — no auth required, CMS broadcast events only ──────
    // Clients (including unauthenticated visitors) subscribe here to receive
    // live CMS update events emitted by admin controllers.
    const publicNs = io.of("/public");
    publicNs.on("connection", (socket) => {
        socket.on("disconnect", () => {});
    });

    // ── Connection handler ────────────────────────────────────────────────────
    io.on("connection", (socket) => {
        const user = socket.user;

        // ── Join private rooms ────────────────────────────────────────────────
        // Every user gets a private room for receiving notifications
        socket.join(`user:${user._id}`);

        // Admins get a broadcast room for new support request alerts
        if (user.role === "admin") {
            socket.join("admin:global");
        }

        // Team members get a shared broadcast room for task/resource updates
        if (user.role === "team") {
            socket.join("team:global");
        }

        // ── Send unread count immediately on connect ───────────────────────────
        Notification.countDocuments({ recipientId: user._id, isRead: false })
            .then((count) => socket.emit("notification:unread_count", { count }))
            .catch(() => {});

        // ═══════════════════════════════════════════════════════════════════════
        // NOTIFICATION EVENTS
        // ═══════════════════════════════════════════════════════════════════════

        // Client requests current unread count (e.g. on reconnect)
        socket.on("notification:get_unread_count", async () => {
            try {
                const count = await Notification.countDocuments({
                    recipientId: user._id,
                    isRead: false,
                });
                socket.emit("notification:unread_count", { count });
            } catch {
                socket.emit("error:global", { message: "Failed to fetch notification count" });
            }
        });

        // Mark a single notification as read
        socket.on("notification:mark_read", async ({ notificationId }) => {
            try {
                await Notification.findOneAndUpdate(
                    { _id: notificationId, recipientId: user._id },
                    { isRead: true }
                );
                const count = await Notification.countDocuments({
                    recipientId: user._id,
                    isRead: false,
                });
                socket.emit("notification:unread_count", { count });
            } catch {
                socket.emit("error:global", { message: "Failed to mark notification as read" });
            }
        });

        // Mark all notifications as read
        socket.on("notification:mark_all_read", async () => {
            try {
                await Notification.updateMany(
                    { recipientId: user._id, isRead: false },
                    { isRead: true }
                );
                socket.emit("notification:unread_count", { count: 0 });
            } catch {
                socket.emit("error:global", { message: "Failed to mark all notifications as read" });
            }
        });

        // ═══════════════════════════════════════════════════════════════════════
        // CHAT EVENTS
        // ═══════════════════════════════════════════════════════════════════════

        // Join a conversation room (admin can join any; others must be participants)
        socket.on("chat:join_conversation", async ({ conversationId }) => {
            try {
                const convoQuery = user.role === "admin"
                    ? { _id: conversationId }
                    : { _id: conversationId, participants: user._id };
                const convo = await Conversation.findOne(convoQuery);
                if (!convo) {
                    socket.emit("error:global", { message: "Conversation not found or access denied" });
                    return;
                }
                socket.join(`conversation:${conversationId}`);
            } catch {
                socket.emit("error:global", { message: "Failed to join conversation" });
            }
        });

        // Leave a conversation room
        socket.on("chat:leave_conversation", ({ conversationId }) => {
            socket.leave(`conversation:${conversationId}`);
        });

        // ── Send a message ────────────────────────────────────────────────────
        socket.on(
            "chat:send_message",
            async ({ conversationId, content, messageType = "text", fileUrl, fileName, fileMime, replyToId }) => {
                try {
                    // Verify participant
                    const convo = await Conversation.findOne({
                        _id: conversationId,
                        participants: user._id,
                    });
                    if (!convo) {
                        socket.emit("error:global", { message: "Conversation not found" });
                        return;
                    }

                    const fileType = fileMime ? detectFileType(fileMime) : null;

                    // Persist message
                    const msg = await Message.create({
                        conversationId,
                        senderId: user._id,
                        content: content || "",
                        messageType,
                        fileUrl: fileUrl || null,
                        fileName: fileName || null,
                        fileType,
                        fileMime: fileMime || null,
                        replyTo: replyToId || null,
                        readBy: [user._id],
                    });

                    // Update conversation last activity
                    await Conversation.findByIdAndUpdate(conversationId, {
                        lastMessage: msg._id,
                        lastMessageAt: new Date(),
                    });

                    // Populate sender + replyTo for the client
                    const populated = await Message.findById(msg._id)
                        .populate("senderId", "name photo role")
                        .populate({
                            path: "replyTo",
                            populate: { path: "senderId", select: "name" },
                        });

                    // Broadcast to conversation room (includes sender — for multi-tab)
                    io.to(`conversation:${conversationId}`).emit("chat:new_message", populated);

                    // Notify every other participant
                    const others = convo.participants.filter(
                        (p) => p.toString() !== user._id.toString()
                    );

                    for (const recipientId of others) {
                        const isFile = messageType === "file";
                        const notifType = isFile ? "file_received" : "message";
                        const notifTitle = isFile
                            ? `${user.name} sent a file`
                            : `New message from ${user.name}`;
                        const notifBody = isFile
                            ? fileName || "File attachment"
                            : content.length > 80
                            ? content.slice(0, 80) + "…"
                            : content;

                        const notif = await Notification.create({
                            recipientId,
                            type: notifType,
                            title: notifTitle,
                            message: notifBody,
                            payload: { conversationId, messageId: msg._id },
                            isRead: false,
                            createdBy: user._id,
                        });

                        io.to(`user:${recipientId}`).emit("notification:new", {
                            _id: notif._id,
                            type: notif.type,
                            title: notif.title,
                            message: notif.message,
                            payload: notif.payload,
                            isRead: false,
                            createdAt: notif.createdAt,
                        });
                    }

                    // Alert admin room when a user initiates support for the first time
                    if (convo.type === "user_admin") {
                        const msgCount = await Message.countDocuments({ conversationId });
                        if (msgCount === 1) {
                            io.to("admin:global").emit("admin:new_support_request", {
                                conversationId,
                                user: { _id: user._id, name: user.name, photo: user.photo },
                            });
                        }
                    }
                } catch (err) {
                    console.error("chat:send_message error:", err);
                    socket.emit("error:global", { message: "Failed to send message" });
                }
            }
        );

        // ── Delete a message (soft delete, sender only) ───────────────────────
        socket.on("chat:delete_message", async ({ messageId }) => {
            try {
                const msg = await Message.findById(messageId);
                if (!msg) return;
                if (msg.senderId.toString() !== user._id.toString()) {
                    socket.emit("error:global", { message: "Cannot delete another user's message" });
                    return;
                }
                msg.isDeleted = true;
                msg.content = "";
                await msg.save();
                io.to(`conversation:${msg.conversationId}`).emit("chat:message_deleted", { messageId });
            } catch {
                socket.emit("error:global", { message: "Failed to delete message" });
            }
        });

        // ── Typing indicator ──────────────────────────────────────────────────
        socket.on("chat:typing", ({ conversationId, isTyping }) => {
            socket.to(`conversation:${conversationId}`).emit("chat:typing_indicator", {
                userId: user._id,
                userName: user.name,
                isTyping,
            });
        });

        // ── Mark messages as read + clear chat notifications ─────────────────
        socket.on("chat:read_messages", async ({ conversationId }) => {
            try {
                // Mark all unread messages in this conversation as read
                await Message.updateMany(
                    { conversationId, readBy: { $ne: user._id } },
                    { $addToSet: { readBy: user._id } }
                );
                io.to(`conversation:${conversationId}`).emit("chat:messages_read", {
                    conversationId,
                    readBy: user._id,
                });

                // Clear chat-related notifications for this conversation
                await Notification.updateMany(
                    {
                        recipientId: user._id,
                        isRead: false,
                        type: { $in: ["message", "file_received"] },
                        "payload.conversationId": conversationId,
                    },
                    { isRead: true }
                );

                // Emit updated unread count so badge updates immediately
                const unreadCount = await Notification.countDocuments({
                    recipientId: user._id,
                    isRead: false,
                });
                socket.emit("notification:unread_count", { count: unreadCount });
            } catch {
                socket.emit("error:global", { message: "Failed to mark messages as read" });
            }
        });

        // ── React to a message (toggle emoji reaction) ────────────────────────
        socket.on("chat:react_message", async ({ messageId, emoji }) => {
            try {
                const msg = await Message.findById(messageId);
                if (!msg) return;

                const existing = msg.reactions.find((r) => r.emoji === emoji);
                const userId = user._id.toString();

                if (existing) {
                    const alreadyReacted = existing.users.some((u) => u.toString() === userId);
                    if (alreadyReacted) {
                        existing.users = existing.users.filter((u) => u.toString() !== userId);
                        if (existing.users.length === 0) {
                            msg.reactions = msg.reactions.filter((r) => r.emoji !== emoji);
                        }
                    } else {
                        existing.users.push(user._id);
                    }
                } else {
                    msg.reactions.push({ emoji, users: [user._id] });
                }

                await msg.save();
                io.to(`conversation:${msg.conversationId}`).emit("chat:reaction_updated", {
                    messageId,
                    reactions: msg.reactions,
                });
            } catch {
                socket.emit("error:global", { message: "Failed to update reaction" });
            }
        });

        // ── Pin / unpin a message ─────────────────────────────────────────────
        socket.on("chat:pin_message", async ({ messageId }) => {
            try {
                const msg = await Message.findById(messageId);
                if (!msg) return;

                const convo = await Conversation.findById(msg.conversationId);
                if (!convo) return;
                const isParticipant = convo.participants.some((p) => p.toString() === user._id.toString());
                if (!isParticipant && user.role !== "admin") {
                    socket.emit("error:global", { message: "Access denied" });
                    return;
                }

                msg.isPinned = !msg.isPinned;
                msg.pinnedBy = msg.isPinned ? user._id : null;
                await msg.save();

                io.to(`conversation:${msg.conversationId}`).emit("chat:message_pinned", {
                    messageId,
                    isPinned: msg.isPinned,
                    pinnedBy: msg.isPinned ? { _id: user._id, name: user.name } : null,
                });
            } catch {
                socket.emit("error:global", { message: "Failed to pin message" });
            }
        });

        // ── Set availability status ───────────────────────────────────────────
        socket.on("user:set_status", async ({ status }) => {
            const VALID = ["available", "busy", "meeting", "away", "wfh", "offline"];
            if (!VALID.includes(status)) return;
            try {
                await User.findByIdAndUpdate(user._id, { availabilityStatus: status });
                const payload = { userId: user._id, status, userName: user.name };
                io.to("team:global").emit("user:status_changed", payload);
                io.to("admin:global").emit("user:status_changed", payload);
                socket.emit("user:status_changed", payload);
            } catch {
                socket.emit("error:global", { message: "Failed to update status" });
            }
        });

        // ── Disconnect cleanup ────────────────────────────────────────────────
        socket.on("disconnect", () => {
            // Socket.IO automatically removes the socket from all rooms on disconnect
        });
    });

    // ── /livechat namespace — live chat handoff ────────────────────────────────
    // Visitors connect WITHOUT a token. Agents connect WITH a JWT in socket.handshake.auth.token.
    const liveChatNs = io.of('/livechat');

    liveChatNs.on('connection', async (socket) => {
        // Rate-limit unauthenticated visitor connections
        const clientIp = socket.handshake.address || '0.0.0.0';
        if (_isLcRateLimited(clientIp)) {
            socket.disconnect();
            return;
        }

        const token = socket.handshake.auth?.token;
        let agentUser = null;

        // ── Authenticate agent if token present ──────────────────────────────────
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
                agentUser = await User.findById(decoded.id).select('-password');
                if (!agentUser || !agentUser.isVerified || !['admin', 'team'].includes(agentUser.role)) {
                    socket.disconnect();
                    return;
                }
                socket.agentUser = agentUser;
                socket.join('lc:agents');
                // Immediately send current waiting + active sessions
                const sessions = await LiveChatSession.find({ status: { $in: ['waiting', 'active'] } })
                    .populate('agentId', 'name photo')
                    .sort({ startedAt: -1 })
                    .lean();
                socket.emit('lc:queue_update', { sessions });
            } catch {
                socket.disconnect();
                return;
            }
        }

        // ── lc:visitor_join ───────────────────────────────────────────────────────
        socket.on('lc:visitor_join', async ({ sessionId, visitorName, visitorEmail, pageUrl, userAgent: ua }) => {
            try {
                if (!sessionId) return;
                // Atomic upsert — prevents duplicate-key race on concurrent joins
                const session = await LiveChatSession.findOneAndUpdate(
                    { sessionId },
                    { $setOnInsert: {
                        sessionId,
                        visitorName: (visitorName || 'Anonymous').trim(),
                        visitorEmail: visitorEmail?.trim() || null,
                        status: 'waiting',
                        startedAt: new Date(),
                        pageUrl: pageUrl || null,
                        userAgent: ua ? String(ua).slice(0, 300) : null,
                    }},
                    { upsert: true, new: true }
                );
                socket.join(`lc:session:${sessionId}`);
                socket.visitorSessionId = sessionId;

                // Notify waiting agents
                const sessions = await LiveChatSession.find({ status: { $in: ['waiting', 'active'] } })
                    .populate('agentId', 'name photo')
                    .sort({ startedAt: -1 })
                    .lean();
                liveChatNs.to('lc:agents').emit('lc:queue_update', { sessions });
                liveChatNs.to('lc:agents').emit('lc:new_session', { session });

                // Notify all admins via notification bell
                await notifyAdmins(io, {
                    type: 'live_chat_request',
                    title: 'New live chat request',
                    message: `${session.visitorName} is waiting for an agent`,
                    payload: { sessionId: session.sessionId },
                });

                // System message back to visitor
                liveChatNs.to(`lc:session:${sessionId}`).emit('lc:new_message', {
                    sessionId,
                    sender: 'system',
                    content: 'Connecting you to an available agent. Please hold on…',
                    timestamp: new Date(),
                });
            } catch (err) {
                console.error('lc:visitor_join error:', err);
            }
        });

        // ── lc:agent_accept ───────────────────────────────────────────────────────
        socket.on('lc:agent_accept', async ({ sessionId }) => {
            if (!socket.agentUser) return;
            try {
                const session = await LiveChatSession.findOneAndUpdate(
                    { sessionId, status: 'waiting' },
                    { status: 'active', agentId: socket.agentUser._id, acceptedAt: new Date() },
                    { new: true }
                ).populate('agentId', 'name photo');
                if (!session) return; // Already accepted by another agent

                socket.join(`lc:session:${sessionId}`);

                // Tell visitor + any other listeners the agent has arrived
                liveChatNs.to(`lc:session:${sessionId}`).emit('lc:session_update', {
                    sessionId,
                    status: 'active',
                    agentId: socket.agentUser._id,
                    agentName: socket.agentUser.name,
                    agentPhoto: socket.agentUser.photo || null,
                });

                const systemContent = `${socket.agentUser.name} has joined the chat.`;
                const systemMsg = await LiveChatMessage.create({
                    sessionId,
                    sender: 'system',
                    content: systemContent,
                });
                liveChatNs.to(`lc:session:${sessionId}`).emit('lc:new_message', {
                    _id: systemMsg._id,
                    sessionId,
                    sender: 'system',
                    content: systemContent,
                    timestamp: systemMsg.timestamp,
                });

                // Refresh agent queue
                const sessions = await LiveChatSession.find({ status: { $in: ['waiting', 'active'] } })
                    .populate('agentId', 'name photo')
                    .sort({ startedAt: -1 })
                    .lean();
                liveChatNs.to('lc:agents').emit('lc:queue_update', { sessions });
            } catch (err) {
                console.error('lc:agent_accept error:', err);
            }
        });

        // ── lc:message ────────────────────────────────────────────────────────────
        socket.on('lc:message', async ({ sessionId: sid, content }) => {
            const sId = sid || socket.visitorSessionId;
            if (!sId || !content?.trim()) return;
            if (!socket.rooms.has(`lc:session:${sId}`)) return;
            try {
                const sender = socket.agentUser ? 'agent' : 'visitor';
                const msg = await LiveChatMessage.create({
                    sessionId: sId,
                    sender,
                    senderId: socket.agentUser?._id || null,
                    content: content.trim(),
                });
                liveChatNs.to(`lc:session:${sId}`).emit('lc:new_message', {
                    _id: msg._id,
                    sessionId: sId,
                    sender,
                    senderId: socket.agentUser?._id || null,
                    senderName: socket.agentUser?.name || null,
                    senderPhoto: socket.agentUser?.photo || null,
                    content: content.trim(),
                    timestamp: msg.timestamp,
                });
            } catch (err) {
                console.error('lc:message error:', err);
            }
        });

        // ── lc:typing ─────────────────────────────────────────────────────────────
        socket.on('lc:typing', ({ sessionId: sid, isTyping }) => {
            const sId = sid || socket.visitorSessionId;
            if (!sId) return;
            if (!socket.rooms.has(`lc:session:${sId}`)) return;
            const sender = socket.agentUser ? 'agent' : 'visitor';
            socket.to(`lc:session:${sId}`).emit('lc:typing_indicator', { sessionId: sId, sender, isTyping });
        });

        // ── lc:close ──────────────────────────────────────────────────────────────
        socket.on('lc:close', async ({ sessionId: sid }) => {
            const sId = sid || socket.visitorSessionId;
            if (!sId) return;
            if (!socket.rooms.has(`lc:session:${sId}`)) return;
            try {
                const closedBy = socket.agentUser ? 'agent' : 'visitor';
                await LiveChatSession.findOneAndUpdate(
                    { sessionId: sId, status: { $ne: 'closed' } },
                    { status: 'closed', closedAt: new Date(), closedBy }
                );
                const closeContent = closedBy === 'agent' ? 'Agent ended the chat.' : 'Visitor has left the chat.';
                const closeMsg = await LiveChatMessage.create({ sessionId: sId, sender: 'system', content: closeContent });
                liveChatNs.to(`lc:session:${sId}`).emit('lc:session_update', { sessionId: sId, status: 'closed', closedBy });
                liveChatNs.to(`lc:session:${sId}`).emit('lc:new_message', {
                    _id: closeMsg._id, sessionId: sId, sender: 'system', content: closeContent, timestamp: closeMsg.timestamp,
                });
                const sessions = await LiveChatSession.find({ status: { $in: ['waiting', 'active'] } })
                    .populate('agentId', 'name photo').sort({ startedAt: -1 }).lean();
                liveChatNs.to('lc:agents').emit('lc:queue_update', { sessions });
                liveChatNs.to('lc:agents').emit('lc:session_closed', { sessionId: sId });
            } catch (err) {
                console.error('lc:close error:', err);
            }
        });

        // ── disconnect — mark as missed if visitor leaves while waiting ───────────
        socket.on('disconnect', async () => {
            if (!socket.agentUser && socket.visitorSessionId) {
                try {
                    const updated = await LiveChatSession.findOneAndUpdate(
                        { sessionId: socket.visitorSessionId, status: 'waiting' },
                        { status: 'missed', closedAt: new Date(), closedBy: 'system' }
                    );
                    if (updated) {
                        const sessions = await LiveChatSession.find({ status: { $in: ['waiting', 'active'] } })
                            .populate('agentId', 'name photo').sort({ startedAt: -1 }).lean();
                        liveChatNs.to('lc:agents').emit('lc:queue_update', { sessions });
                        liveChatNs.to('lc:agents').emit('lc:session_closed', { sessionId: socket.visitorSessionId });
                    }
                } catch { /* non-critical */ }
            }
        });
    });

    return io;
}
