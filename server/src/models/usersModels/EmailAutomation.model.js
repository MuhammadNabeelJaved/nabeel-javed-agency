/**
 * EmailAutomation model — configurable email trigger rules.
 *
 * Each document defines ONE trigger event + the email to send.
 * The automation engine reads active rules and fires them when
 * the matching event occurs in the system.
 *
 * Supported trigger events:
 *   project_completed    — fires when a project status → completed
 *   project_approved     — fires when a project status → approved
 *   project_rejected     — fires when a project status → rejected
 *   milestone_ready      — fires when a milestone status → needs_approval
 *   milestone_approved   — fires when a milestone status → approved
 *   welcome_user         — fires when a new user verifies their email
 *   review_request       — scheduled N days after project_completed
 *   payment_reminder     — scheduled when dueAmount > 0 after N days
 *   inactivity_followup  — scheduled N days after last login
 */
import mongoose from 'mongoose';

const emailAutomationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Automation name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    trigger: {
        type: String,
        required: true,
        enum: [
            'project_completed',
            'project_approved',
            'project_rejected',
            'milestone_ready',
            'milestone_approved',
            'welcome_user',
            'review_request',
            'payment_reminder',
            'inactivity_followup',
        ],
        index: true,
    },

    // Delay in hours before sending (0 = immediate)
    delayHours: {
        type: Number,
        default: 0,
        min: 0,
        max: 8760, // 1 year
    },

    isEnabled: {
        type: Boolean,
        default: true,
        index: true,
    },

    // Email content
    emailSubject: {
        type: String,
        required: [true, 'Email subject is required'],
        trim: true,
        maxlength: [200, 'Subject cannot exceed 200 characters'],
    },

    emailBody: {
        type: String,
        required: [true, 'Email body is required'],
        trim: true,
        maxlength: [10000, 'Email body cannot exceed 10000 characters'],
    },

    // Plain-text fallback
    emailText: {
        type: String,
        trim: true,
        maxlength: [2000, 'Plain text cannot exceed 2000 characters'],
    },

    // Optional conditions (JSON string — parsed at runtime)
    conditions: {
        type: String,
        default: '{}',
    },

    // Stats
    sentCount: {
        type: Number,
        default: 0,
    },

    lastFiredAt: {
        type: Date,
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

}, { timestamps: true, versionKey: false });

const EmailAutomation = mongoose.models.EmailAutomation || mongoose.model('EmailAutomation', emailAutomationSchema);
export default EmailAutomation;
