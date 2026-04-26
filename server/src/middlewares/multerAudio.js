import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import AppError from "../utils/AppError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadPath = path.join(__dirname, "../public/uploads/audio");
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

const ALLOWED_MIME = new Set([
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/ogg",
    "audio/mp4",
    "audio/x-m4a",
    "audio/aac",
]);

const ALLOWED_EXT = new Set([".mp3", ".wav", ".ogg", ".m4a", ".aac"]);

function sanitizeFilename(original) {
    return original
        .replace(/[/\\?%*:|"<>]/g, "-")
        .replace(/\.{2,}/g, ".")
        .slice(0, 100);
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadPath),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${sanitizeFilename(file.originalname)}`),
});

function fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_MIME.has(file.mimetype) || !ALLOWED_EXT.has(ext)) {
        return cb(new AppError("Only MP3, WAV, OGG, M4A, and AAC audio files are allowed.", 415), false);
    }
    cb(null, true);
}

const uploadAudio = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter,
});

export default uploadAudio;
