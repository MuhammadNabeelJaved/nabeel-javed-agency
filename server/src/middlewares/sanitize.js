/**
 * Input Sanitization Middleware
 *
 * Covers:
 *  - NoSQL / MongoDB operator injection prevention
 *  - RegEx special-character escaping (ReDoS protection)
 *  - Automatic body string trimming
 *  - Parameter pollution prevention (arrays flattened to last value)
 *
 * OWASP A03 – Injection
 */

/**
 * Escape all RegExp special characters from a user-supplied string so it can
 * be safely embedded inside a MongoDB `$regex` query without enabling
 * pattern injection or ReDoS attacks.
 *
 * Usage in controllers:
 *   const safe = escapeRegex(req.query.search);
 *   Model.find({ name: { $regex: safe, $options: "i" } });
 *
 * @param {unknown} value
 * @returns {string}
 */
export function escapeRegex(value) {
    if (typeof value !== "string") return "";
    // Escape: \ ^ $ . | ? * + ( ) [ ] { }
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Recursively strip keys that start with "$" or contain "." from a plain
 * object/array.  Prevents an attacker from injecting MongoDB operators
 * (e.g. `{ "$gt": "" }`) through the request body or query string.
 *
 * @param {unknown} input
 * @returns {unknown}
 */
function stripOperators(input) {
    if (Array.isArray(input)) {
        return input.map(stripOperators);
    }
    if (input !== null && typeof input === "object") {
        const clean = {};
        for (const [k, v] of Object.entries(input)) {
            // Drop keys that start with "$" (MongoDB operators) or contain "."
            if (k.startsWith("$") || k.includes(".")) continue;
            clean[k] = stripOperators(v);
        }
        return clean;
    }
    return input;
}

/**
 * Mutate an object in-place by stripping operator keys.
 * Used for req.query and req.params which are read-only getters in Express 5
 * (cannot be reassigned, but their enumerable properties can be mutated).
 */
function stripInPlace(obj) {
    for (const key of Object.keys(obj)) {
        if (key.startsWith("$") || key.includes(".")) {
            delete obj[key];
        } else {
            const cleaned = stripOperators(obj[key]);
            // Only update the property if the value changed (avoids unnecessary writes)
            if (cleaned !== obj[key]) obj[key] = cleaned;
        }
    }
}

/**
 * Express middleware: sanitizes req.body, req.query and req.params against
 * MongoDB operator injection.  Apply globally in app.js before all routes.
 *
 * req.body can be reassigned (set by body-parser).
 * req.query and req.params are read-only getters in Express 5 — mutate in-place.
 */
export function sanitizeMongo(req, _res, next) {
    if (req.body)   req.body = stripOperators(req.body);
    if (req.query && typeof req.query === "object")  stripInPlace(req.query);
    if (req.params && typeof req.params === "object") stripInPlace(req.params);
    next();
}

/**
 * Express middleware: trim leading/trailing whitespace from every top-level
 * string value in req.body.  Prevents whitespace-only fields and avoids
 * subtle mismatches in comparisons.
 */
export function trimBody(req, _res, next) {
    if (req.body && typeof req.body === "object" && !Array.isArray(req.body)) {
        for (const key of Object.keys(req.body)) {
            if (typeof req.body[key] === "string") {
                req.body[key] = req.body[key].trim();
            }
        }
    }
    next();
}

/**
 * Express middleware: collapse repeated query params to the last value to
 * prevent HTTP Parameter Pollution (HPP) attacks.
 *
 * e.g. ?role=admin&role=user  →  role = "user"  (not ["admin","user"])
 *
 * Exclusions: params where an array is legitimately expected (e.g. "ids").
 */
const ARRAY_ALLOWED = new Set(["ids", "tags", "status"]);

export function preventHPP(req, _res, next) {
    if (req.query) {
        for (const [key, val] of Object.entries(req.query)) {
            if (Array.isArray(val) && !ARRAY_ALLOWED.has(key)) {
                req.query[key] = val[val.length - 1]; // keep last value
            }
        }
    }
    next();
}
