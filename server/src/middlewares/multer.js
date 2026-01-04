import multer from "multer";
import path from "path";

const __dirname = path.resolve();

// Set up multer storage configuration

export const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + '/uploads');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

// Create a Multer instance
export const upload = multer({ storage });