/**
 * Support Ticket Controller
 *
 * User endpoints:   create, get own tickets, add user reply
 * Admin endpoints:  get all, get stats, update status/notes, add admin reply, delete
 */
import SupportTicket from '../../models/usersModels/SupportTicket.model.js';
import AppError from '../../utils/AppError.js';
import asyncHandler from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/apiResponse.js';

// ─── User: Create Ticket ──────────────────────────────────────────────────────
export const createTicket = asyncHandler(async (req, res) => {
  const { subject, category, priority, message } = req.body;
  if (!subject || !message) throw new AppError('Subject and message are required', 400);

  const ticket = await SupportTicket.create({
    subject,
    category: category || 'General',
    priority: priority || 'Medium',
    message,
    submittedBy: req.user._id,
  });

  await ticket.populate('submittedBy', 'name email photo');
  return successResponse(res, 'Ticket submitted successfully', ticket, 201);
});

// ─── User: Get Own Tickets ────────────────────────────────────────────────────
export const getMyTickets = asyncHandler(async (req, res) => {
  const tickets = await SupportTicket.find({ submittedBy: req.user._id })
    .populate('responses.respondedBy', 'name role')
    .sort({ createdAt: -1 })
    .lean();

  return successResponse(res, 'Tickets fetched', tickets);
});

// ─── User: Add Reply to Own Ticket ────────────────────────────────────────────
export const addUserReply = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  if (!message) throw new AppError('Reply message is required', 400);

  const ticket = await SupportTicket.findOne({ _id: id, submittedBy: req.user._id });
  if (!ticket) throw new AppError('Ticket not found', 404);
  if (ticket.status === 'Closed') throw new AppError('Cannot reply to a closed ticket', 400);

  ticket.responses.push({ message, isAdmin: false, respondedBy: req.user._id });
  // Re-open if resolved
  if (ticket.status === 'Resolved') ticket.status = 'Open';
  await ticket.save();
  await ticket.populate('submittedBy', 'name email photo');
  await ticket.populate('responses.respondedBy', 'name role');

  return successResponse(res, 'Reply added', ticket);
});

// ─── Admin: Get All Tickets ───────────────────────────────────────────────────
export const getAllTickets = asyncHandler(async (req, res) => {
  const { status, priority, category, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status && status !== 'all')   filter.status   = status;
  if (priority && priority !== 'all') filter.priority = priority;
  if (category && category !== 'all') filter.category = category;

  const skip = (Number(page) - 1) * Number(limit);

  const [tickets, total] = await Promise.all([
    SupportTicket.find(filter)
      .populate('submittedBy', 'name email photo role')
      .populate('responses.respondedBy', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    SupportTicket.countDocuments(filter),
  ]);

  return successResponse(res, 'Tickets fetched', {
    tickets,
    pagination: {
      total,
      page:       Number(page),
      limit:      Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

// ─── Admin: Get Stats ─────────────────────────────────────────────────────────
export const getTicketStats = asyncHandler(async (req, res) => {
  const [total, open, inProgress, resolved, closed, urgent] = await Promise.all([
    SupportTicket.countDocuments(),
    SupportTicket.countDocuments({ status: 'Open' }),
    SupportTicket.countDocuments({ status: 'In Progress' }),
    SupportTicket.countDocuments({ status: 'Resolved' }),
    SupportTicket.countDocuments({ status: 'Closed' }),
    SupportTicket.countDocuments({ priority: 'Urgent' }),
  ]);

  return successResponse(res, 'Stats fetched', {
    total, open, inProgress, resolved, closed, urgent,
  });
});

// ─── Admin: Update Ticket Status / Notes ─────────────────────────────────────
export const updateTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, priority, adminNotes } = req.body;

  const ticket = await SupportTicket.findById(id);
  if (!ticket) throw new AppError('Ticket not found', 404);

  if (status)               ticket.status     = status;
  if (priority)             ticket.priority   = priority;
  if (adminNotes !== undefined) ticket.adminNotes = adminNotes;
  if (status === 'Resolved' && !ticket.resolvedAt) ticket.resolvedAt = new Date();

  await ticket.save();
  await ticket.populate('submittedBy', 'name email photo role');
  await ticket.populate('responses.respondedBy', 'name role');

  return successResponse(res, 'Ticket updated', ticket);
});

// ─── Admin: Add Response / Reply ──────────────────────────────────────────────
export const addAdminResponse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  if (!message) throw new AppError('Response message is required', 400);

  const ticket = await SupportTicket.findById(id);
  if (!ticket) throw new AppError('Ticket not found', 404);

  ticket.responses.push({ message, isAdmin: true, respondedBy: req.user._id });
  if (ticket.status === 'Open') ticket.status = 'In Progress';

  await ticket.save();
  await ticket.populate('submittedBy', 'name email photo role');
  await ticket.populate('responses.respondedBy', 'name role');

  return successResponse(res, 'Response added', ticket);
});

// ─── Admin: Delete Ticket ─────────────────────────────────────────────────────
export const deleteTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ticket = await SupportTicket.findByIdAndDelete(id);
  if (!ticket) throw new AppError('Ticket not found', 404);
  return successResponse(res, 'Ticket deleted', null);
});
