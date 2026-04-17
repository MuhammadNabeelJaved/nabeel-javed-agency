import asyncHandler from '../../middlewares/asyncHandler.js';
import AppError from '../../utils/AppError.js';
import { successResponse } from '../../utils/apiResponse.js';
import LiveChatSession from '../../models/usersModels/LiveChatSession.model.js';
import LiveChatMessage from '../../models/usersModels/LiveChatMessage.model.js';
import CannedResponse from '../../models/usersModels/CannedResponse.model.js';
import { createAndEmitNotification } from '../../utils/notificationService.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

function sessionFilter(req, extra = {}) {
  const filter = { ...extra };
  // Team members see only their own sessions
  if (req.user.role === 'team') {
    filter.$or = [{ assignedTo: req.user._id }, { agentId: req.user._id }];
  }
  return filter;
}

// ── Stats ──────────────────────────────────────────────────────────────────────

export const getStats = asyncHandler(async (req, res) => {
  const base = req.user.role === 'team'
    ? { $or: [{ assignedTo: req.user._id }, { agentId: req.user._id }] }
    : {};

  const [total, waiting, active, closed, missed] = await Promise.all([
    LiveChatSession.countDocuments(base),
    LiveChatSession.countDocuments({ ...base, status: 'waiting' }),
    LiveChatSession.countDocuments({ ...base, status: 'active' }),
    LiveChatSession.countDocuments({ ...base, status: 'closed' }),
    LiveChatSession.countDocuments({ ...base, status: 'missed' }),
  ]);

  const accepted = await LiveChatSession.find({
    ...base,
    status: { $in: ['active', 'closed'] },
    acceptedAt: { $ne: null },
  }).select('startedAt acceptedAt').lean();

  const avgWaitMs = accepted.length
    ? accepted.reduce((sum, s) => sum + (s.acceptedAt - s.startedAt), 0) / accepted.length
    : 0;
  const avgWaitSec = Math.round(avgWaitMs / 1000);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTotal = await LiveChatSession.countDocuments({ ...base, startedAt: { $gte: todayStart } });

  successResponse(res, 'Stats fetched', { total, waiting, active, closed, missed, avgWaitSec, todayTotal });
});

// ── Sessions ───────────────────────────────────────────────────────────────────

export const getSessions = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 30, search } = req.query;
  const filter = sessionFilter(req);
  if (status) filter.status = status;
  if (search) {
    const regex = { $regex: search, $options: 'i' };
    filter.$or = [{ visitorName: regex }, { visitorEmail: regex }];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [sessions, total] = await Promise.all([
    LiveChatSession.find(filter)
      .populate('agentId', 'name photo')
      .populate('assignedTo', 'name photo role')
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    LiveChatSession.countDocuments(filter),
  ]);
  successResponse(res, 'Sessions fetched', { sessions, total, page: Number(page), limit: Number(limit) });
});

export const getSessionById = asyncHandler(async (req, res) => {
  const filter = sessionFilter(req, { _id: req.params.id });
  const session = await LiveChatSession.findOne(filter)
    .populate('agentId', 'name photo role')
    .populate('assignedTo', 'name photo role')
    .lean();
  if (!session) throw new AppError('Session not found', 404);
  const messages = await LiveChatMessage.find({ sessionId: session.sessionId })
    .sort({ timestamp: 1 }).lean();
  successResponse(res, 'Session fetched', { session, messages });
});

export const updateSession = asyncHandler(async (req, res) => {
  const { tags, agentNotes, status } = req.body;
  const update = {};
  if (tags !== undefined) update.tags = tags;
  if (agentNotes !== undefined) update.agentNotes = agentNotes;
  if (status) {
    const allowed = ['closed', 'missed'];
    if (!allowed.includes(status)) throw new AppError('Invalid status transition via REST', 400);
    update.status = status;
    if (status === 'closed') { update.closedAt = new Date(); update.closedBy = 'agent'; }
  }
  const session = await LiveChatSession.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!session) throw new AppError('Session not found', 404);
  successResponse(res, 'Session updated', { session });
});

export const deleteSession = asyncHandler(async (req, res) => {
  const session = await LiveChatSession.findByIdAndDelete(req.params.id);
  if (!session) throw new AppError('Session not found', 404);
  await LiveChatMessage.deleteMany({ sessionId: session.sessionId });
  successResponse(res, 'Session deleted', null);
});

export const getMessages = asyncHandler(async (req, res) => {
  const session = await LiveChatSession.findOne(
    sessionFilter(req, { sessionId: req.params.sessionId })
  ).lean();
  if (!session) throw new AppError('Session not found', 404);
  const messages = await LiveChatMessage.find({ sessionId: req.params.sessionId })
    .sort({ timestamp: 1 }).lean();
  successResponse(res, 'Messages fetched', { messages });
});

// ── Assign session to team member ──────────────────────────────────────────────

export const assignSession = asyncHandler(async (req, res) => {
  const { assignedTo } = req.body;
  const session = await LiveChatSession.findByIdAndUpdate(
    req.params.id,
    { assignedTo: assignedTo || null },
    { new: true }
  )
    .populate('assignedTo', 'name photo role')
    .populate('agentId', 'name photo');
  if (!session) throw new AppError('Session not found', 404);

  if (assignedTo) {
    const io = req.app.get('io');
    if (io) {
      createAndEmitNotification(io, {
        recipientId: assignedTo,
        type: 'live_chat_request',
        title: 'Live chat session assigned to you',
        message: `${session.visitorName} is waiting — a session has been assigned to you`,
        payload: { sessionId: session.sessionId },
        createdBy: req.user._id,
      }).catch(() => {});
    }
  }

  successResponse(res, 'Session assigned', { session });
});

// ── Canned responses ───────────────────────────────────────────────────────────

export const getCannedResponses = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) {
    const re = { $regex: req.query.search, $options: 'i' };
    filter.$or = [{ title: re }, { shortcut: re }, { content: re }];
    delete filter.isActive; // search all, including inactive for admin
  }
  const responses = await CannedResponse.find(filter)
    .sort({ category: 1, title: 1 }).lean();
  successResponse(res, 'Canned responses fetched', { responses });
});

export const createCannedResponse = asyncHandler(async (req, res) => {
  const { title, shortcut, content, category } = req.body;
  if (!title || !content) throw new AppError('Title and content are required', 400);
  const doc = await CannedResponse.create({
    title, shortcut: shortcut || '', content, category: category || 'General',
    createdBy: req.user._id,
  });
  successResponse(res, 'Canned response created', { response: doc }, 201);
});

export const updateCannedResponse = asyncHandler(async (req, res) => {
  const { title, shortcut, content, category, isActive } = req.body;
  const update = {};
  if (title !== undefined) update.title = title;
  if (shortcut !== undefined) update.shortcut = shortcut;
  if (content !== undefined) update.content = content;
  if (category !== undefined) update.category = category;
  if (isActive !== undefined) update.isActive = isActive;
  const doc = await CannedResponse.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!doc) throw new AppError('Canned response not found', 404);
  successResponse(res, 'Canned response updated', { response: doc });
});

export const deleteCannedResponse = asyncHandler(async (req, res) => {
  const doc = await CannedResponse.findByIdAndDelete(req.params.id);
  if (!doc) throw new AppError('Canned response not found', 404);
  successResponse(res, 'Canned response deleted', null);
});

// ── AI reply suggestion ────────────────────────────────────────────────────────

export const suggestReply = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) throw new AppError('sessionId required', 400);

  const messages = await LiveChatMessage.find({ sessionId })
    .sort({ timestamp: -1 }).limit(10).lean();
  messages.reverse();

  if (!messages.length) {
    return successResponse(res, 'Suggestion generated', {
      suggestion: 'Hello! How can I help you today?',
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new AppError('AI not configured', 503);

  const history = messages.map(m => {
    const who = m.sender === 'visitor' ? 'Visitor' : m.sender === 'agent' ? 'Agent' : null;
    return who ? `${who}: ${m.content}` : null;
  }).filter(Boolean).join('\n');

  const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 250,
      messages: [{
        role: 'user',
        content: `You are a helpful customer support agent for a web agency. Based on this conversation, suggest a short, helpful reply (1-3 sentences). Be professional and friendly. Reply with ONLY the suggested message text, nothing else.\n\nConversation:\n${history}\n\nSuggest the next agent reply:`,
      }],
    }),
  });

  if (!aiRes.ok) throw new AppError('AI suggestion failed', 502);
  const data = await aiRes.json();
  const suggestion = data.content?.[0]?.text?.trim() || '';
  successResponse(res, 'Suggestion generated', { suggestion });
});
