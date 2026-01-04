import multer from "multer"
import path from "path"

const pathDirectory = path.resolve("./public/uploads")

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, pathDirectory)
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`)
    }
})

const upload = multer({ storage })

export default upload

