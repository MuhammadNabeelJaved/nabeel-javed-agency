/**
 * Security-aware Request Logger
 *
 * Writes two log streams:
 *  logs/access.log   – every HTTP request (method, url, status, ms, ip, user)
 *  logs/security.log – security events: auth failures, rate-limit hits,
 *                      unauthorized access, suspicious patterns
 *
 * Format: one JSON object per line (NDJSON) for easy ingestion by log
 * aggregators (Datadog, CloudWatch, ELK, etc.).
 *
 * OWASP A09 – Security Logging and Monitoring Failures
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Resolve <project-root>/logs/ relative to this file's location
const LOG_DIR = path.resolve(__dirname, "../../logs");
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const ACCESS_LOG   = path.join(LOG_DIR, "access.log");
const SECURITY_LOG = path.join(LOG_DIR, "security.log");

/** Append one JSON line to a log file (non-blocking). */
function writeLine(filePath, obj) {
    fs.appendFile(filePath, JSON.stringify(obj) + "\n", (err) => {
        if (err && process.env.NODE_ENV === "development") {
            console.error("[Logger] write error:", err.message);
        }
    });
}

/** Extract the real client IP, honouring common reverse-proxy headers. */
function clientIp(req) {
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) return forwarded.split(",")[0].trim();
    return req.socket?.remoteAddress ?? "unknown";
}

// ── Middleware ────────────────────────────────────────────────────────────────

/**
 * HTTP access logger.
 * Attach to the Express app globally; logs every response on "finish".
 */
export function requestLogger(req, res, next) {
    const start = Date.now();
    const ip    = clientIp(req);

    res.on("finish", () => {
        const entry = {
            t:      new Date().toISOString(),
            method: req.method,
            url:    req.originalUrl,
            status: res.statusCode,
            ms:     Date.now() - start,
            ip,
            user:   req.user?._id?.toString() ?? null,
            ua:     (req.headers["user-agent"] ?? "").slice(0, 150),
        };

        writeLine(ACCESS_LOG, entry);

        // Echo 4xx/5xx to stdout in development for quick debugging
        if (process.env.NODE_ENV === "development" && res.statusCode >= 400) {
            console.warn(
                `[${entry.t}] ${entry.method} ${entry.url} → ${entry.status} (${entry.ms}ms) ip=${entry.ip}`
            );
        }
    });

    next();
}

// ── Security event logger ─────────────────────────────────────────────────────

/**
 * Log a discrete security event to security.log.
 *
 * Call from controllers or middleware whenever a security-significant event
 * occurs (failed login, unauthorized access attempt, suspicious input, etc.).
 *
 * @param {string} event  – Short uppercase event type, e.g. "AUTH_FAIL"
 * @param {object} detail – Free-form context (ip, userId, url, reason …)
 */
export function securityLog(event, detail = {}) {
    const entry = { t: new Date().toISOString(), event, ...detail };
    writeLine(SECURITY_LOG, entry);

    if (process.env.NODE_ENV === "development") {
        console.warn(`[SECURITY] ${event}`, detail);
    }
}

// ── Pre-built security event helpers ─────────────────────────────────────────

/** Failed login attempt */
export const logAuthFail = (req, reason) =>
    securityLog("AUTH_FAIL", {
        ip:     clientIp(req),
        email:  req.body?.email ?? null,
        reason,
        url:    req.originalUrl,
    });

/** Successful login */
export const logAuthSuccess = (req, userId) =>
    securityLog("AUTH_SUCCESS", {
        ip:     clientIp(req),
        userId: userId?.toString(),
        url:    req.originalUrl,
    });

/** Access to a protected resource without valid credentials */
export const logUnauthorized = (req, reason) =>
    securityLog("UNAUTHORIZED", {
        ip:     clientIp(req),
        url:    req.originalUrl,
        method: req.method,
        reason,
    });

/** Role-based access denial */
export const logForbidden = (req, userRole, requiredRoles) =>
    securityLog("FORBIDDEN", {
        ip:           clientIp(req),
        userId:       req.user?._id?.toString(),
        userRole,
        requiredRoles,
        url:          req.originalUrl,
    });

/** Validation failure containing potentially malicious input */
export const logValidationFail = (req, errors) =>
    securityLog("VALIDATION_FAIL", {
        ip:     clientIp(req),
        url:    req.originalUrl,
        method: req.method,
        errors: errors?.slice?.(0, 5) ?? errors,  // cap log size
    });
