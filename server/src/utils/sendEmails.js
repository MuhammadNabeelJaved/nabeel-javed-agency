/**
 * Email utility – wraps the Resend SDK for transactional emails.
 *
 * Required environment variables:
 *   RESEND_API_KEY – Resend API key
 *   FROM_EMAIL     – Verified sender address (e.g. "no-reply@yourdomain.com")
 */
import { Resend } from 'resend';

// Initialise Resend client with the API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

// Sender address used for all outbound emails
const from = process.env.FROM_EMAIL;

/**
 * Base email sender. All other helpers delegate to this function.
 *
 * @param {Object} options
 * @param {string|string[]} options.to      - Recipient address(es)
 * @param {string}          options.subject - Email subject line
 * @param {string}          options.html    - HTML body
 * @param {string}          options.text    - Plain-text fallback body
 * @returns {Promise<Object>} Resend response data
 * @throws {Error} If the Resend API returns an error
 */
export const sendEmail = async ({ to, subject, html, text }) => {
    const { data, error } = await resend.emails.send({
        from,
        to,
        subject,
        html,
        text,
    });

    if (error) {
        throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
};

/**
 * Sends a 6-digit email verification code to a newly registered user.
 *
 * @param {Object} options
 * @param {string} options.to   - Recipient email address
 * @param {string} options.name - User's display name (used in the greeting)
 * @param {string} options.code - 6-digit numeric verification code
 * @returns {Promise<Object>} Resend response data
 */
export const sendVerificationEmail = async ({ to, name, code }) => {
    return sendEmail({
        to,
        subject: 'Verify your email address',
        html: `
            <h2>Hello ${name},</h2>
            <p>Your email verification code is:</p>
            <h1 style="letter-spacing: 4px;">${code}</h1>
            <p>This code will expire in 10 minutes.</p>
        `,
        text: `Hello ${name}, your verification code is: ${code}. It expires in 10 minutes.`,
    });
};

/**
 * Sends a password-reset link to a user who requested a password reset.
 *
 * @param {Object} options
 * @param {string} options.to       - Recipient email address
 * @param {string} options.name     - User's display name
 * @param {string} options.resetUrl - Signed reset URL (expires in 10 minutes)
 * @returns {Promise<Object>} Resend response data
 */
export const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
    return sendEmail({
        to,
        subject: 'Password Reset Request',
        html: `
            <h2>Hello ${name},</h2>
            <p>You requested a password reset. Click the link below:</p>
            <a href="${resetUrl}">Reset Password</a>
            <p>This link will expire in 10 minutes. If you did not request this, ignore this email.</p>
        `,
        text: `Hello ${name}, reset your password here: ${resetUrl}. Link expires in 10 minutes.`,
    });
};

/**
 * Sends a confirmation email to the job applicant after they submit an application.
 *
 * @param {Object} options
 * @param {string} options.to         - Applicant email address
 * @param {string} options.name       - Applicant first name
 * @param {string} options.jobTitle   - Title of the job they applied for
 * @param {string} options.department - Department of the job
 * @returns {Promise<Object>} Resend response data
 */
export const sendJobApplicationConfirmation = async ({ to, name, jobTitle, department }) => {
    return sendEmail({
        to,
        subject: `Application Received — ${jobTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <div style="border-bottom: 2px solid #7c3aed; padding-bottom: 20px; margin-bottom: 30px;">
                    <h1 style="color: #7c3aed; margin: 0;">Nabeel Agency</h1>
                </div>
                <h2>Hi ${name},</h2>
                <p>Thank you for applying! We've received your application for the <strong>${jobTitle}</strong> position in the <strong>${department}</strong> department.</p>
                <div style="background: #f5f3ff; border-left: 4px solid #7c3aed; padding: 16px; border-radius: 4px; margin: 24px 0;">
                    <p style="margin: 0;"><strong>What happens next?</strong></p>
                    <ol style="margin: 12px 0 0 0; padding-left: 20px;">
                        <li style="margin-bottom: 8px;">Our team will review your application carefully.</li>
                        <li style="margin-bottom: 8px;">If your profile matches our requirements, we'll reach out to schedule a screening call.</li>
                        <li>Final decisions are typically communicated within 2–3 weeks.</li>
                    </ol>
                </div>
                <p>In the meantime, feel free to browse our <a href="${process.env.CLIENT_URL || 'https://nabeel.agency'}/portfolio" style="color: #7c3aed;">portfolio</a> to learn more about our work.</p>
                <p>Best regards,<br><strong>The Nabeel Agency Team</strong></p>
                <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 30px; font-size: 12px; color: #9ca3af;">
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        `,
        text: `Hi ${name}, we received your application for ${jobTitle} (${department}). Our team will review it and reach out if your profile matches our requirements. Decisions are typically communicated within 2-3 weeks. — Nabeel Agency`,
    });
};

/**
 * Notifies the admin that a new job application was submitted.
 *
 * @param {Object} options
 * @param {string} options.to            - Admin email address
 * @param {string} options.applicantName - Full name of the applicant
 * @param {string} options.applicantEmail - Email of the applicant
 * @param {string} options.jobTitle      - Job title applied for
 * @param {string} options.department    - Department
 * @param {string} options.applicationId - MongoDB _id of the application
 * @returns {Promise<Object>} Resend response data
 */
export const sendJobApplicationAdminNotification = async ({
    to,
    applicantName,
    applicantEmail,
    jobTitle,
    department,
    applicationId,
}) => {
    const adminUrl = `${process.env.CLIENT_URL || 'https://nabeel.agency'}/admin/job-applications`;
    return sendEmail({
        to,
        subject: `New Application: ${applicantName} applied for ${jobTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <div style="border-bottom: 2px solid #7c3aed; padding-bottom: 20px; margin-bottom: 30px;">
                    <h1 style="color: #7c3aed; margin: 0;">Nabeel Agency — Admin Alert</h1>
                </div>
                <h2>New Job Application Received</h2>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr style="background: #f9fafb;">
                        <td style="padding: 10px 14px; font-weight: bold; border: 1px solid #e5e7eb;">Applicant</td>
                        <td style="padding: 10px 14px; border: 1px solid #e5e7eb;">${applicantName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 14px; font-weight: bold; border: 1px solid #e5e7eb;">Email</td>
                        <td style="padding: 10px 14px; border: 1px solid #e5e7eb;">${applicantEmail}</td>
                    </tr>
                    <tr style="background: #f9fafb;">
                        <td style="padding: 10px 14px; font-weight: bold; border: 1px solid #e5e7eb;">Position</td>
                        <td style="padding: 10px 14px; border: 1px solid #e5e7eb;">${jobTitle}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 14px; font-weight: bold; border: 1px solid #e5e7eb;">Department</td>
                        <td style="padding: 10px 14px; border: 1px solid #e5e7eb;">${department}</td>
                    </tr>
                    <tr style="background: #f9fafb;">
                        <td style="padding: 10px 14px; font-weight: bold; border: 1px solid #e5e7eb;">Application ID</td>
                        <td style="padding: 10px 14px; border: 1px solid #e5e7eb; font-family: monospace; font-size: 12px;">${applicationId}</td>
                    </tr>
                </table>
                <a href="${adminUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                    View Application in Dashboard →
                </a>
            </div>
        `,
        text: `New application from ${applicantName} (${applicantEmail}) for ${jobTitle} (${department}). View at: ${adminUrl}`,
    });
};
