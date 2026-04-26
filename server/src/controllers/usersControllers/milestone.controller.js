import Milestone from '../../models/usersModels/Milestone.model.js';
import Project from '../../models/usersModels/Project.model.js';
import asyncHandler from '../../middlewares/asyncHandler.js';
import AppError from '../../utils/AppError.js';
import { successResponse } from '../../utils/apiResponse.js';
import { emitDataUpdate } from '../../utils/dataUpdateService.js';
import { createAndEmitNotification } from '../../utils/notificationService.js';
import { sendEmail } from '../../utils/sendEmails.js';
import { fireAutomation } from '../../utils/emailAutomationService.js';

// GET /api/v1/milestones?project=id — get milestones for a project
export const getMilestones = asyncHandler(async (req, res) => {
    const { project } = req.query;
    if (!project) throw new AppError('project query param is required', 400);

    // Access control: user can only see their own project milestones
    const proj = await Project.findById(project);
    if (!proj) throw new AppError('Project not found', 404);

    const isAdmin = req.user.role === 'admin';
    const isTeam  = req.user.role === 'team';
    const isOwner = proj.requestedBy.toString() === req.user._id.toString();
    const isAssigned = proj.assignedTeam.some(id => id.toString() === req.user._id.toString());

    if (!isAdmin && !isTeam && !isOwner && !isAssigned) {
        throw new AppError('Access denied', 403);
    }

    const milestones = await Milestone.find({ project })
        .sort({ order: 1, createdAt: 1 })
        .populate('approvedBy', 'name email')
        .populate('createdBy', 'name email')
        .lean();

    successResponse(res, 'Milestones fetched', milestones);
});

// GET /api/v1/milestones/admin — all milestones (admin)
export const getAllMilestones = asyncHandler(async (req, res) => {
    const { project, status, phase } = req.query;
    const filter = {};
    if (project) filter.project = project;
    if (status)  filter.status  = status;
    if (phase)   filter.phase   = phase;

    const milestones = await Milestone.find(filter)
        .sort({ createdAt: -1 })
        .populate('project', 'projectName status requestedBy')
        .populate('createdBy', 'name email')
        .populate('approvedBy', 'name email')
        .lean();

    successResponse(res, 'All milestones fetched', milestones);
});

// POST /api/v1/milestones — create (admin/team)
export const createMilestone = asyncHandler(async (req, res) => {
    const { project, title, description, phase, order, dueDate, deliverables } = req.body;

    if (!project || !title || !phase) {
        throw new AppError('project, title, and phase are required', 400);
    }

    const proj = await Project.findById(project).populate('requestedBy', 'name email');
    if (!proj) throw new AppError('Project not found', 404);

    const milestone = await Milestone.create({
        project, title, description, phase,
        order: order ?? 0,
        dueDate,
        deliverables: deliverables || [],
        createdBy: req.user._id,
        status: 'pending',
    });

    emitDataUpdate(req.app.get('io'), 'milestones', ['admin:global', 'team:global', `user:${proj.requestedBy._id}`]);

    successResponse(res, 'Milestone created', milestone, 201);
});

// PUT /api/v1/milestones/:id — update (admin/team)
export const updateMilestone = asyncHandler(async (req, res) => {
    const { title, description, phase, order, dueDate, deliverables, status } = req.body;

    const milestone = await Milestone.findById(req.params.id).populate({ path: 'project', populate: { path: 'requestedBy', select: 'name email' } });
    if (!milestone) throw new AppError('Milestone not found', 404);

    // Only admin can set status to needs_approval/approved/rejected directly
    const allowedStatuses = ['pending', 'in_progress', 'needs_approval'];
    if (status && !allowedStatuses.includes(status) && req.user.role !== 'admin') {
        throw new AppError('Only admin can approve/reject milestones', 403);
    }

    const prevStatus = milestone.status;

    if (title)       milestone.title       = title;
    if (description !== undefined) milestone.description = description;
    if (phase)       milestone.phase       = phase;
    if (order !== undefined)  milestone.order  = order;
    if (dueDate !== undefined) milestone.dueDate = dueDate;
    if (deliverables) milestone.deliverables = deliverables;
    if (status)      milestone.status      = status;

    if (status === 'needs_approval' && prevStatus !== 'needs_approval') {
        milestone.completedAt = new Date();
    }

    await milestone.save();

    const proj = milestone.project;
    const ownerId = proj.requestedBy._id || proj.requestedBy;

    // Notify client when milestone is ready for review
    if (status === 'needs_approval' && prevStatus !== 'needs_approval') {
        await createAndEmitNotification(req.app.get('io'), {
            recipientId: ownerId,
            type: 'status_updated',
            title: 'Milestone Ready for Review',
            message: `"${milestone.title}" on "${proj.projectName}" is ready for your approval.`,
            payload: { projectId: proj._id, milestoneId: milestone._id },
            createdBy: req.user._id,
        });

        // Send email notification
        if (proj.requestedBy?.email) {
            sendEmail({
                to: proj.requestedBy.email,
                subject: `Milestone Ready for Approval — ${proj.projectName}`,
                html: `<p>Hi ${proj.requestedBy.name},</p><p>The milestone "<strong>${milestone.title}</strong>" on your project "<strong>${proj.projectName}</strong>" is ready for your review and approval.</p><p><a href="${process.env.CLIENT_URL}/user-dashboard/projects">View Milestone</a></p>`,
                text: `Hi ${proj.requestedBy.name}, the milestone "${milestone.title}" on "${proj.projectName}" is ready for review.`,
            }).catch(() => {});
        }

        fireAutomation('milestone_ready', {
            userName: proj.requestedBy?.name,
            userEmail: proj.requestedBy?.email,
            projectName: proj.projectName,
            projectType: proj.projectType,
            milestoneTitle: milestone.title,
        }).catch(() => {});
    }

    emitDataUpdate(req.app.get('io'), 'milestones', ['admin:global', 'team:global', `user:${ownerId}`]);
    successResponse(res, 'Milestone updated', milestone);
});

// PUT /api/v1/milestones/:id/approve — client approves milestone
export const approveMilestone = asyncHandler(async (req, res) => {
    const milestone = await Milestone.findById(req.params.id).populate({ path: 'project', populate: { path: 'requestedBy', select: '_id name email' } });
    if (!milestone) throw new AppError('Milestone not found', 404);

    const proj = milestone.project;
    const isOwner = proj.requestedBy._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') throw new AppError('Only the project owner can approve milestones', 403);

    if (milestone.status !== 'needs_approval') {
        throw new AppError('Milestone is not pending approval', 400);
    }

    milestone.status     = 'approved';
    milestone.approvedBy = req.user._id;
    milestone.approvedAt = new Date();
    await milestone.save();

    fireAutomation('milestone_approved', {
        userName: proj.requestedBy?.name,
        userEmail: proj.requestedBy?.email,
        projectName: proj.projectName,
        projectType: proj.projectType,
        milestoneTitle: milestone.title,
    }).catch(() => {});

    emitDataUpdate(req.app.get('io'), 'milestones', ['admin:global', 'team:global', `user:${proj.requestedBy._id}`]);
    successResponse(res, 'Milestone approved', milestone);
});

// PUT /api/v1/milestones/:id/reject — client rejects milestone
export const rejectMilestone = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const milestone = await Milestone.findById(req.params.id).populate({ path: 'project', populate: { path: 'requestedBy', select: '_id name' } });
    if (!milestone) throw new AppError('Milestone not found', 404);

    const proj = milestone.project;
    const isOwner = proj.requestedBy._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') throw new AppError('Only the project owner can reject milestones', 403);

    if (milestone.status !== 'needs_approval') {
        throw new AppError('Milestone is not pending approval', 400);
    }

    milestone.status          = 'rejected';
    milestone.rejectionReason = reason || '';
    await milestone.save();

    emitDataUpdate(req.app.get('io'), 'milestones', ['admin:global', 'team:global', `user:${proj.requestedBy._id}`]);
    successResponse(res, 'Milestone rejected', milestone);
});

// DELETE /api/v1/milestones/:id — admin only
export const deleteMilestone = asyncHandler(async (req, res) => {
    const milestone = await Milestone.findByIdAndDelete(req.params.id);
    if (!milestone) throw new AppError('Milestone not found', 404);
    successResponse(res, 'Milestone deleted', null);
});

// PATCH /api/v1/milestones/:id/deliverable/:delivId — toggle deliverable
export const toggleDeliverable = asyncHandler(async (req, res) => {
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) throw new AppError('Milestone not found', 404);

    const deliv = milestone.deliverables.id(req.params.delivId);
    if (!deliv) throw new AppError('Deliverable not found', 404);

    deliv.isComplete = !deliv.isComplete;
    await milestone.save();
    successResponse(res, 'Deliverable updated', milestone);
});
