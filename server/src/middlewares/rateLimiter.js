/**
 * Tiered Rate Limiters
 *
 * Apply at the route level for fine-grained control:
 *
 *  globalLimiter   — applied to ALL routes in app.js (removes the dangerous
 *                    "skip authenticated users" loophole)
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

/** General cap — blocks automated scanners, not normal users. */
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,   // 15 min
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    // NO skip — authenticated users must comply too
    message: jsonTooMany("Too many requests. Please try again in 15 minutes."),
});

/**
 * Auth endpoints (login, register, forgot-password).
 * Tight window; only failed attempts count against the limit.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
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
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: jsonTooMany("Too many verification attempts. Please wait 15 minutes."),
});

/** File upload endpoints — prevents upload abuse / storage exhaustion. */
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: jsonTooMany("Upload limit reached. Please try again in an hour."),
});

/** State-changing routes (POST/PUT/DELETE) that are not auth-specific. */
export const mutationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 150,
    standardHeaders: true,
    legacyHeaders: false,
    message: jsonTooMany("Too many write requests. Please slow down."),
});
