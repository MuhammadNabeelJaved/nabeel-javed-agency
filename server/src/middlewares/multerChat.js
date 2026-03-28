/**
 * Multer middleware for chat file uploads.
 * Accepts any file type — images, videos, audio, docs, archives, etc.
 * Cloudinary's resource_type:'auto' handles storage for all formats.
 *
 * Limits:
 *  - 50 MB per file (covers images, short videos, docs)
 *  - Filename sanitized to prevent path traversal
 */
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const uploadPath = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

function sanitizeFilename(original) {
    return original
        .replace(/[/\\?%*:|"<>]/g, "-")
        .replace(/\.{2,}/g, ".")
        .slice(0, 150);
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadPath),
    filename:    (_req, file, cb) =>
        cb(null, `${Date.now()}-${sanitizeFilename(file.originalname)}`),
});

const multerChat = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

export default multerChat;
