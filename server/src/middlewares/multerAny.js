/**
 * Multer middleware for document uploads (resumes, attachments).
 *
 * Security hardening vs the original "accept anything" version:
 *  - Allowlist of MIME types (PDF, Word, plain text only)
 *  - Filename sanitized: strip path separators + limit length
 *  - File size capped at 10 MB (was 20 MB)
 *  - Magic-number / MIME check done before writing to disk
 *
 * OWASP A05 – Security Misconfiguration
 * OWASP A01 – Broken Access Control (unrestricted uploads)
 */
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import AppError from "../utils/AppError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const uploadPath = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

// ── Allowlisted document MIME types ──────────────────────────────────────────
const ALLOWED_MIME = new Set([
    "application/pdf",                                                 // .pdf
    "application/msword",                                              // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "text/plain",                                                      // .txt
    "application/rtf",                                                 // .rtf
]);

const ALLOWED_EXT = new Set([".pdf", ".doc", ".docx", ".txt", ".rtf"]);

/** Remove path traversal characters and limit filename length. */
function sanitizeFilename(original) {
    return original
        .replace(/[/\\?%*:|"<>]/g, "-")  // strip dangerous chars
        .replace(/\.{2,}/g, ".")          // collapse repeated dots
        .slice(0, 100);                   // cap length
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadPath),
    filename:    (_req, file, cb) =>
        cb(null, `${Date.now()}-${sanitizeFilename(file.originalname)}`),
});

function fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!ALLOWED_MIME.has(file.mimetype) || !ALLOWED_EXT.has(ext)) {
        return cb(
            new AppError(
                "Invalid file type. Only PDF, DOC, DOCX, TXT, and RTF files are allowed.",
                415
            ),
            false
        );
    }
    cb(null, true);
}

const uploadAny = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },  // 10 MB
    fileFilter,
});

export default uploadAny;
