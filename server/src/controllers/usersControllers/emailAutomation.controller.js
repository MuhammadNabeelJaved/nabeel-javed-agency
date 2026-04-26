import EmailAutomation from '../../models/usersModels/EmailAutomation.model.js';
import asyncHandler from '../../middlewares/asyncHandler.js';
import AppError from '../../utils/AppError.js';
import { successResponse } from '../../utils/apiResponse.js';

// GET /api/v1/email-automations
export const getAll = asyncHandler(async (req, res) => {
    const automations = await EmailAutomation.find()
        .sort({ trigger: 1, createdAt: -1 })
        .populate('createdBy', 'name email')
        .lean();
    successResponse(res, 'Automations fetched', automations);
});

// GET /api/v1/email-automations/:id
export const getById = asyncHandler(async (req, res) => {
    const auto = await EmailAutomation.findById(req.params.id).lean();
    if (!auto) throw new AppError('Automation not found', 404);
    successResponse(res, 'Automation fetched', auto);
});

// POST /api/v1/email-automations
export const create = asyncHandler(async (req, res) => {
    const { name, trigger, delayHours, isEnabled, emailSubject, emailBody, emailText, conditions } = req.body;

    if (!name || !trigger || !emailSubject || !emailBody) {
        throw new AppError('name, trigger, emailSubject, and emailBody are required', 400);
    }

    const auto = await EmailAutomation.create({
        name, trigger, delayHours, isEnabled,
        emailSubject, emailBody, emailText,
        conditions: conditions ? JSON.stringify(conditions) : '{}',
        createdBy: req.user._id,
    });

    successResponse(res, 'Automation created', auto, 201);
});

// PUT /api/v1/email-automations/:id
export const update = asyncHandler(async (req, res) => {
    const auto = await EmailAutomation.findById(req.params.id);
    if (!auto) throw new AppError('Automation not found', 404);

    const fields = ['name', 'trigger', 'delayHours', 'isEnabled', 'emailSubject', 'emailBody', 'emailText'];
    fields.forEach(f => { if (req.body[f] !== undefined) auto[f] = req.body[f]; });
    if (req.body.conditions !== undefined) auto.conditions = JSON.stringify(req.body.conditions);

    await auto.save();
    successResponse(res, 'Automation updated', auto);
});

// PATCH /api/v1/email-automations/:id/toggle
export const toggle = asyncHandler(async (req, res) => {
    const auto = await EmailAutomation.findById(req.params.id);
    if (!auto) throw new AppError('Automation not found', 404);
    auto.isEnabled = !auto.isEnabled;
    await auto.save();
    successResponse(res, `Automation ${auto.isEnabled ? 'enabled' : 'disabled'}`, auto);
});

// DELETE /api/v1/email-automations/:id
export const remove = asyncHandler(async (req, res) => {
    const auto = await EmailAutomation.findByIdAndDelete(req.params.id);
    if (!auto) throw new AppError('Automation not found', 404);
    successResponse(res, 'Automation deleted', null);
});

// GET /api/v1/email-automations/stats
export const getStats = asyncHandler(async (req, res) => {
    const stats = await EmailAutomation.aggregate([
        { $group: {
            _id: '$trigger',
            total: { $sum: 1 },
            enabled: { $sum: { $cond: ['$isEnabled', 1, 0] } },
            sentCount: { $sum: '$sentCount' },
        }},
        { $sort: { _id: 1 } },
    ]);
    const totalSent = await EmailAutomation.aggregate([{ $group: { _id: null, total: { $sum: '$sentCount' } } }]);
    successResponse(res, 'Stats fetched', { byTrigger: stats, totalSent: totalSent[0]?.total || 0 });
});
