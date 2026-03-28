/**
 * Input Validation Middleware  (express-validator v7)
 *
 * Provides:
 *  - validate()        – runs a schema and short-circuits with 422 on failure
 *  - Reusable field rules (email, password, name, mongoId, pagination)
 *  - Ready-made schemas for auth, contact, profile update
 *
 * OWASP A03 – Injection  |  OWASP A04 – Insecure Design
 */
import { validationResult, body, param, query } from "express-validator";
import AppError from "../utils/AppError.js";

// ── Core runner ───────────────────────────────────────────────────────────────

/**
 * Compose a validation chain: run each check, then inspect results.
 * Returns 422 with a joined error message if any check fails.
 *
 * Usage:
 *   router.post("/register", validate([emailRule(), passwordRule()]), handler);
 *
 * @param {import("express-validator").ValidationChain[]} checks
 */
export const validate = (checks) => [
    ...checks,
    (req, _res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const msg = errors
                .array({ onlyFirstError: true })
                .map((e) => e.msg)
                .join("; ");
            return next(new AppError(msg, 422));
        }
        next();
    },
];

// ── Reusable field rules ──────────────────────────────────────────────────────

export const emailRule = (field = "email") =>
    body(field)
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("A valid email address is required")
        .normalizeEmail({ gmail_remove_dots: false })
        .isLength({ max: 254 }).withMessage("Email address is too long");

export const passwordRule = (field = "password") =>
    body(field)
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 8, max: 128 }).withMessage("Password must be 8–128 characters")
        .matches(/[A-Z]/).withMessage("Password must include at least one uppercase letter")
        .matches(/[0-9]/).withMessage("Password must include at least one number");

export const nameRule = (field = "name", label) => {
    const lbl = label || field;
    return body(field)
        .trim()
        .notEmpty().withMessage(`${lbl} is required`)
        .isLength({ min: 2, max: 100 }).withMessage(`${lbl} must be 2–100 characters`)
        .matches(/^[\p{L}0-9\s'.,\-_&()]+$/u)
        .withMessage(`${lbl} contains invalid characters`);
};

export const mongoIdParam = (field = "id") =>
    param(field)
        .isMongoId().withMessage(`Invalid ${field} format`);

export const paginationRules = () => [
    query("page")
        .optional()
        .isInt({ min: 1 }).withMessage("page must be a positive integer")
        .toInt(),
    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100")
        .toInt(),
];

export const searchRule = () =>
    query("search")
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage("Search query too long")
        .escape();  // HTML-encode special chars before they reach the DB layer

// ── Ready-made validation schemas ────────────────────────────────────────────

/** POST /users/register */
export const registerSchema = validate([
    nameRule("name", "Name"),
    emailRule(),
    passwordRule(),
]);

/** POST /users/login */
export const loginSchema = validate([
    emailRule(),
    body("password").notEmpty().withMessage("Password is required"),
]);

/** POST /users/forgot-password */
export const forgotPasswordSchema = validate([emailRule()]);

/** POST /users/reset-password/:token */
export const resetPasswordSchema = validate([
    passwordRule("password"),
    body("confirmPassword")
        .custom((val, { req }) => {
            if (val !== req.body.password) throw new Error("Passwords do not match");
            return true;
        }),
]);

/** POST /contacts (public contact form) */
export const contactSchema = validate([
    nameRule("firstName", "First name"),
    nameRule("lastName", "Last name"),
    emailRule(),
    body("subject")
        .trim()
        .notEmpty().withMessage("Subject is required")
        .isLength({ min: 2, max: 200 }).withMessage("Subject must be 2–200 characters"),
    body("message")
        .trim()
        .notEmpty().withMessage("Message is required")
        .isLength({ min: 10, max: 5000 }).withMessage("Message must be 10–5,000 characters"),
]);

/** PUT /users/update/:id */
export const updateProfileSchema = validate([
    body("name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage("Name must be 2–100 characters"),
    body("phone")
        .optional()
        .trim()
        .isMobilePhone("any", { strictMode: false }).withMessage("Invalid phone number"),
    body("bio")
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage("Bio must be under 500 characters"),
    body("position")
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage("Position must be under 100 characters"),
]);

/** POST /job-applications (public resume submission) */
export const jobApplicationSchema = validate([
    nameRule("firstName", "First name"),
    nameRule("lastName", "Last name"),
    emailRule(),
    body("phone")
        .optional()
        .trim()
        .isMobilePhone("any", { strictMode: false }).withMessage("Invalid phone number"),
    body("coverLetter")
        .optional()
        .trim()
        .isLength({ max: 3000 }).withMessage("Cover letter must be under 3,000 characters"),
    body("desiredRole")
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage("Desired role must be under 100 characters"),
]);

/** POST /projects (client project request) */
export const createProjectSchema = validate([
    body("projectName")
        .trim()
        .notEmpty().withMessage("Project name is required")
        .isLength({ min: 2, max: 200 }).withMessage("Project name must be 2–200 characters"),
    body("projectType")
        .trim()
        .notEmpty().withMessage("Project type is required"),
    body("budgetRange")
        .trim()
        .notEmpty().withMessage("Budget range is required"),
    body("projectDetails")
        .trim()
        .notEmpty().withMessage("Project details are required")
        .isLength({ min: 20, max: 5000 }).withMessage("Project details must be 20–5,000 characters"),
]);
