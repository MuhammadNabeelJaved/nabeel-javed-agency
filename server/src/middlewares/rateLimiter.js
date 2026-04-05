/**
 * Tiered Rate Limiters
 *
 * Apply at the route level for fine-grained control:
 *
 *  globalLimiter   — applied to ALL routes in app.js; 15 req / 1 min per IP
 *  authLimiter     — login / register / forgot-password (brute-force guard)
 *  otpLimiter      — OTP verify / resend (prevents 6-digit code brute-force)
 *  uploadLimiter   — file upload endpoints
 *  mutationLimiter — state-changing API routes (create, update, delete)
 */
import rateLimit from "express-rate-limit";

const jsonTooMany = (msg) => ({
    success: false,
    message: msg,
});

/**
 * Global cap — covers all routes.
 * 100 req/min is comfortable for dashboard users (page loads fire 3-5 parallel
 * requests) while still stopping scrapers and credential-stuffing bots.
 */
export const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,   // 1 min
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: jsonTooMany("Too many requests. Please try again in a minute."),
});

/**
 * Auth endpoints (login, register, forgot-password).
 * Only failed attempts count; 10 failures per 15 min before lockout.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 min
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: jsonTooMany("Too many authentication attempts. Please wait 15 minutes before trying again."),
});

/**
 * OTP / email-verification endpoints.
 * 6-digit code = 1M combinations; 5 tries per 15 min forces attacker to wait.
 */
export const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 min
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: jsonTooMany("Too many verification attempts. Please wait 15 minutes."),
});

/**
 * File upload endpoints — prevents upload abuse / storage exhaustion.
 * 20 uploads per hour is generous for real users and punishing for abusers.
 */
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: jsonTooMany("Upload limit reached. Please try again in an hour."),
});

/**
 * State-changing routes (POST/PUT/DELETE) that are not auth-specific.
 * 50 mutations per minute covers normal admin/team usage; rate-limits bulk scripts.
 */
export const mutationLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,   // 1 min
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: jsonTooMany("Too many write requests. Please slow down."),
});
