/**
 * Email Automation Service
 *
 * Call `fireAutomation(trigger, context)` after any event that should
 * trigger automated emails. This function:
 *   1. Finds all enabled automations for the given trigger
 *   2. Processes {{PLACEHOLDER}} tokens in subject + body using the context
 *   3. Schedules or immediately sends the email
 *   4. Increments the `sentCount` counter non-blocking
 *
 * Context object shape (pass whatever is available — missing keys become ''):
 *   { userName, userEmail, projectName, projectType, milestoneTitle, dashboardUrl, reviewUrl, adminUrl, ... }
 */

import EmailAutomation from '../models/usersModels/EmailAutomation.model.js';
import User from '../models/usersModels/User.model.js';
import { sendEmail } from './sendEmails.js';

/**
 * Replaces all {{KEY}} tokens in a string with values from the context object.
 */
function renderBody(template, context) {
    return Object.entries(context).reduce(
        (str, [key, val]) => str.replaceAll(`{{${key.toUpperCase()}}}`, val ?? ''),
        template
    );
}

function toPlaceholderKey(key) {
    return String(key)
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/[\s-]+/g, '_')
        .toUpperCase();
}

/**
 * Fires all enabled automations for the given trigger.
 * Non-blocking — errors are logged, never thrown.
 *
 * @param {string} trigger — one of the trigger enum values
 * @param {Object} context — key-value pairs for template rendering
 */
export async function fireAutomation(trigger, context = {}) {
    try {
        const automations = await EmailAutomation.find({ trigger, isEnabled: true }).lean();
        if (automations.length === 0) return;

        const clientUrl = process.env.CLIENT_URL || 'https://nabeel.agency';
        const fullContext = {
            DASHBOARD_URL: `${clientUrl}/user-dashboard`,
            REVIEW_URL:    `${clientUrl}/user-dashboard/reviews`,
            ADMIN_URL:     `${clientUrl}/admin`,
            CLIENT_URL:    clientUrl,
            ...Object.fromEntries(
                Object.entries(context).map(([k, v]) => [toPlaceholderKey(k), v])
            ),
        };

        for (const auto of automations) {
            const send = async () => {
                if (trigger === 'inactivity_followup' && fullContext.USER_ID && fullContext.LOGIN_BASELINE_AT) {
                    const user = await User.findById(fullContext.USER_ID).select('lastLoginAt').lean();
                    const baselineMs = new Date(fullContext.LOGIN_BASELINE_AT).getTime();
                    const currentLoginMs = user?.lastLoginAt ? new Date(user.lastLoginAt).getTime() : 0;

                    // Skip if the user has logged in again since this inactivity timer was created.
                    if (!user || !baselineMs || currentLoginMs !== baselineMs) {
                        return;
                    }
                }

                const subject = renderBody(auto.emailSubject, fullContext);
                const html    = renderBody(auto.emailBody,    fullContext);
                const text    = auto.emailText ? renderBody(auto.emailText, fullContext) : undefined;

                if (!fullContext.USER_EMAIL) return; // no recipient

                await sendEmail({ to: fullContext.USER_EMAIL, subject, html, text });

                // Update stats non-blocking
                EmailAutomation.findByIdAndUpdate(auto._id, {
                    $inc: { sentCount: 1 },
                    lastFiredAt: new Date(),
                }).catch(() => {});
            };

            if (auto.delayHours > 0) {
                setTimeout(send, auto.delayHours * 60 * 60 * 1000);
            } else {
                send().catch(err => console.error(`[emailAutomation] ${auto.name}:`, err.message));
            }
        }
    } catch (err) {
        console.error('[emailAutomation] fireAutomation error:', err.message);
    }
}

export async function scheduleInactivityFollowup(user) {
    if (!user?._id || !user?.email) return;

    await fireAutomation('inactivity_followup', {
        userId: user._id.toString(),
        userName: user.name,
        userEmail: user.email,
        loginBaselineAt: user.lastLoginAt?.toISOString?.() || new Date().toISOString(),
    });
}
