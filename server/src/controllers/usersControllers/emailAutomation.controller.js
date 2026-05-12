import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import EmailAutomation from '../../models/usersModels/EmailAutomation.model.js';
import EmailTemplateOverride from '../../models/usersModels/EmailTemplateOverride.model.js';
import asyncHandler from '../../middlewares/asyncHandler.js';
import AppError from '../../utils/AppError.js';
import { successResponse } from '../../utils/apiResponse.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '../../../email-templates');

const AUTOMATION_TEMPLATES = [
    {
        file: '5-signup-confirmation.html',
        name: 'Welcome Email',
        description: 'Sent when a new user verifies their email and account is ready.',
        bestFor: 'welcome_user',
        suggestedSubject: 'Welcome to Nabeel Agency — your account is ready',
        placeholders: ['{{NAME}}', '{{EMAIL}}', '{{DASHBOARD_URL}}'],
    },
    {
        file: '6-project-created.html',
        name: 'Project Received',
        description: 'Confirms receipt of a new project request with full project details.',
        bestFor: 'project_approved',
        suggestedSubject: 'Project "{{PROJECT_NAME}}" received — we\'re on it',
        placeholders: ['{{NAME}}', '{{PROJECT_NAME}}', '{{PROJECT_TYPE}}', '{{BUDGET_RANGE}}', '{{DEADLINE}}', '{{PROJECT_INITIAL}}', '{{DASHBOARD_URL}}'],
    },
    {
        file: '7-project-completed.html',
        name: 'Project Completed',
        description: 'Celebrates project delivery and invites the client to leave feedback.',
        bestFor: 'project_completed',
        suggestedSubject: 'Your project "{{PROJECT_NAME}}" has been delivered!',
        placeholders: ['{{NAME}}', '{{PROJECT_NAME}}', '{{COMPLETED_DATE}}', '{{FEEDBACK_URL}}', '{{DASHBOARD_URL}}'],
    },
    {
        file: '8-feedback-request.html',
        name: 'Feedback Request',
        description: 'Asks the client to leave a review after project completion.',
        bestFor: 'review_request',
        suggestedSubject: 'We\'d love your feedback on "{{PROJECT_NAME}}"',
        placeholders: ['{{NAME}}', '{{PROJECT_NAME}}', '{{FEEDBACK_URL}}'],
    },
    {
        file: '9-project-rejected.html',
        name: 'Project Not Accepted',
        description: 'Informs the client their project request could not be accepted.',
        bestFor: 'project_rejected',
        suggestedSubject: 'Update on your project request — {{PROJECT_NAME}}',
        placeholders: ['{{NAME}}', '{{PROJECT_NAME}}', '{{PROJECT_TYPE}}', '{{DASHBOARD_URL}}', '{{CLIENT_URL}}'],
    },
    {
        file: '10-milestone-ready.html',
        name: 'Milestone Ready for Review',
        description: 'Notifies the client a milestone needs their approval.',
        bestFor: 'milestone_ready',
        suggestedSubject: 'Action required: review milestone "{{MILESTONE_TITLE}}"',
        placeholders: ['{{NAME}}', '{{MILESTONE_TITLE}}', '{{PROJECT_NAME}}', '{{DASHBOARD_URL}}'],
    },
    {
        file: '11-milestone-approved.html',
        name: 'Milestone Approved',
        description: 'Notifies the team that the client approved a milestone.',
        bestFor: 'milestone_approved',
        suggestedSubject: 'Milestone "{{MILESTONE_TITLE}}" approved — great work!',
        placeholders: ['{{NAME}}', '{{MILESTONE_TITLE}}', '{{PROJECT_NAME}}', '{{DASHBOARD_URL}}'],
    },
    {
        file: '12-payment-reminder.html',
        name: 'Payment Reminder',
        description: 'Reminds the client about an outstanding payment on their project.',
        bestFor: 'payment_reminder',
        suggestedSubject: 'Payment reminder for {{PROJECT_NAME}} — ${{DUE_AMOUNT}} due',
        placeholders: ['{{NAME}}', '{{PROJECT_NAME}}', '{{TOTAL_COST}}', '{{PAID_AMOUNT}}', '{{DUE_AMOUNT}}', '{{DASHBOARD_URL}}'],
    },
    {
        file: '13-inactivity-followup.html',
        name: 'We Miss You',
        description: 'Re-engages inactive clients who haven\'t logged in for a while.',
        bestFor: 'inactivity_followup',
        suggestedSubject: 'We miss you, {{NAME}} — your dashboard is waiting',
        placeholders: ['{{NAME}}', '{{DASHBOARD_URL}}', '{{CLIENT_URL}}'],
    },
];

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

// GET /api/v1/email-automations/templates
export const getTemplates = asyncHandler(async (req, res) => {
    // Load all DB overrides in one query
    const overrides = await EmailTemplateOverride.find().lean();
    const overrideByFile = Object.fromEntries(overrides.filter(o => o.originalFile).map(o => [o.originalFile, o]));
    const customTemplates = overrides.filter(o => o.isCustom);

    // Built-in templates — use DB override html if present
    const builtIn = AUTOMATION_TEMPLATES.map(t => {
        let html = '';
        try { html = fs.readFileSync(path.join(TEMPLATES_DIR, t.file), 'utf-8'); } catch { /* skip */ }
        if (!html) return null;
        const override = overrideByFile[t.file];
        return {
            _id: override?._id?.toString() || null,
            file: t.file,
            name: override?.name || t.name,
            description: override?.description || t.description,
            bestFor: override?.bestFor || t.bestFor,
            suggestedSubject: override?.suggestedSubject || t.suggestedSubject,
            placeholders: override?.placeholders?.length ? override.placeholders : t.placeholders,
            html: override?.html || html,
            isCustom: false,
            aiGenerated: false,
            isEdited: !!override,
        };
    }).filter(Boolean);

    // Custom + AI templates (not tied to a file)
    const custom = customTemplates.map(t => ({
        _id: t._id.toString(),
        file: null,
        name: t.name,
        description: t.description || '',
        bestFor: t.bestFor || 'custom',
        suggestedSubject: t.suggestedSubject || '',
        placeholders: t.placeholders || [],
        html: t.html,
        isCustom: true,
        aiGenerated: t.aiGenerated || false,
        isEdited: false,
    }));

    successResponse(res, 'Templates fetched', [...builtIn, ...custom]);
});

// PUT /api/v1/email-automations/templates/:id  (edit built-in by file name, or custom by _id)
export const updateTemplate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, bestFor, suggestedSubject, placeholders, html } = req.body;
    if (!html) throw new AppError('html is required', 400);

    // id might be a file name (built-in) or a Mongo ObjectId
    const isFile = id.endsWith('.html');

    if (isFile) {
        // Upsert override for built-in template
        const meta = AUTOMATION_TEMPLATES.find(t => t.file === id);
        if (!meta) throw new AppError('Template not found', 404);
        const updated = await EmailTemplateOverride.findOneAndUpdate(
            { originalFile: id },
            {
                originalFile: id,
                name: name || meta.name,
                description: description ?? meta.description,
                bestFor: bestFor || meta.bestFor,
                suggestedSubject: suggestedSubject ?? meta.suggestedSubject,
                placeholders: placeholders || meta.placeholders,
                html,
                isCustom: false,
                createdBy: req.user._id,
            },
            { upsert: true, new: true }
        );
        return successResponse(res, 'Template updated', updated);
    }

    // Custom template by ObjectId
    const tmpl = await EmailTemplateOverride.findById(id);
    if (!tmpl) throw new AppError('Template not found', 404);
    if (name) tmpl.name = name;
    if (description !== undefined) tmpl.description = description;
    if (bestFor) tmpl.bestFor = bestFor;
    if (suggestedSubject !== undefined) tmpl.suggestedSubject = suggestedSubject;
    if (placeholders) tmpl.placeholders = placeholders;
    tmpl.html = html;
    await tmpl.save();
    successResponse(res, 'Template updated', tmpl);
});

// POST /api/v1/email-automations/templates  (save a new custom template)
export const createTemplate = asyncHandler(async (req, res) => {
    const { name, description, bestFor, suggestedSubject, placeholders, html, aiGenerated } = req.body;
    if (!name || !html) throw new AppError('name and html are required', 400);
    const tmpl = await EmailTemplateOverride.create({
        name, description, bestFor: bestFor || 'custom',
        suggestedSubject, placeholders: placeholders || [],
        html, isCustom: true,
        aiGenerated: !!aiGenerated,
        createdBy: req.user._id,
    });
    successResponse(res, 'Template created', tmpl, 201);
});

// DELETE /api/v1/email-automations/templates/:id  (custom only)
export const deleteTemplate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (id.endsWith('.html')) throw new AppError('Built-in templates cannot be deleted. Reset them instead.', 400);
    const tmpl = await EmailTemplateOverride.findById(id);
    if (!tmpl) throw new AppError('Template not found', 404);
    if (!tmpl.isCustom) throw new AppError('Only custom templates can be deleted', 400);
    await tmpl.deleteOne();
    successResponse(res, 'Template deleted', null);
});

// DELETE /api/v1/email-automations/templates/:id/reset  (revert built-in override)
export const resetTemplate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id.endsWith('.html')) throw new AppError('Only built-in template overrides can be reset', 400);
    await EmailTemplateOverride.findOneAndDelete({ originalFile: id });
    successResponse(res, 'Template reset to original', null);
});

// POST /api/v1/email-automations/templates/generate  (AI-powered generation)
export const generateTemplate = asyncHandler(async (req, res) => {
    const { trigger, name, description, tone } = req.body;
    if (!name && !description) throw new AppError('name or description is required', 400);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new AppError('AI generation is not configured (missing ANTHROPIC_API_KEY)', 503);

    // Load a reference template for design context
    let refTemplate = '';
    try { refTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, '7-project-completed.html'), 'utf-8'); } catch { /* skip */ }

    const triggerLabel = (trigger || 'general').replace(/_/g, ' ');
    const prompt = `You are an expert HTML email designer for Nabeel Agency, a web development agency.

Design a complete, responsive HTML email template with this specification:
- Template name: ${name || 'Email Template'}
- Purpose / trigger: ${triggerLabel}
- Description: ${description || 'General purpose agency email'}
- Tone: ${tone || 'professional and friendly'}

DESIGN SYSTEM (follow exactly):
${refTemplate ? `Reference template (match this structure):
${refTemplate}

` : ''}STRICT RULES:
1. Use IDENTICAL structure: #f5f5f5 outer bg, #ffffff card, border-radius:16px, box-shadow
2. Logo: <img src="https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/uploads/216147d0-06c1-4dee-8a5a-f933c6ef8556/1766429553723-26c2f3fe/N_Logo-01.png" height="30">
3. All CSS must be inline — no external stylesheets, only a small <style> block for media queries
4. Must be responsive with @media max-width:600px
5. Use {{PLACEHOLDER}} tokens — pick appropriate ones: {{NAME}}, {{PROJECT_NAME}}, {{DASHBOARD_URL}}, {{CLIENT_URL}}, {{EMAIL}}, {{MILESTONE_TITLE}}, {{FEEDBACK_URL}}, {{DUE_AMOUNT}} etc.
6. Include a colored top accent bar (4px height gradient) matching the email's theme color
7. Include an icon circle (emoji inside colored circle) matching the theme
8. Footer: © 2025 Nabeel Agency. All rights reserved.
9. CTA button(s): bold, rounded (border-radius:10px), matches theme color
10. Return ONLY the complete HTML — no markdown, no explanations`;

    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
    });

    let html = message.content[0]?.type === 'text' ? message.content[0].text : '';
    // Strip markdown code fences if Claude wrapped the output
    html = html.replace(/^```html?\s*/i, '').replace(/\s*```$/, '').trim();

    if (!html || !html.includes('<!DOCTYPE')) {
        throw new AppError('AI did not return valid HTML. Please try again.', 500);
    }

    successResponse(res, 'Template generated', { html });
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
