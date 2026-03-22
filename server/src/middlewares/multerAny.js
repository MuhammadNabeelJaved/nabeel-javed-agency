/**
 * Multer middleware that accepts ANY file type (for resource uploads).
 * Max size: 20 MB.
 */
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadPath = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadPath),
    filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const uploadAny = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

export default uploadAny;
