import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import AppError from '../utils/AppError.js';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("Cloudinary Configured:", {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY ? '***' : null,
    api_secret: process.env.CLOUDINARY_API_SECRET ? '***' : null,
});

const uploadImage = async (image, folderName = "avatars") => {
    try {
        if (!image) {
            throw new AppError(400, "Image is required")
        }

        console.log("Uploading image:", image, "to folder:", folderName)
        const result = await cloudinary.uploader.upload(image, {
            folder: folderName
        })

        if (!result) {
            throw new AppError(500, "Response from Cloudinary is empty. Failed to upload image to Cloudinary")
        }
        fs.unlinkSync(image)
        return result
    } catch (error) {
        fs.unlinkSync(image)
        throw new AppError(500, "Failed to upload image to Cloudinary")
    }
}

const deleteImage = async (imageUrl, folderName = "avatars") => {
    console.log("Image URL", imageUrl)
    try {
        if (!imageUrl) {
            throw new AppError(400, "Image URL is required")
        }
        const publicId = folderName + "/" + imageUrl.split("/").pop().split(".")[0]
        console.log("publicId", publicId)
        const result = await cloudinary.uploader.destroy(publicId)
        if (!result) {
            throw new AppError(500, "Failed to delete image from Cloudinary")
        }
        if (result.result === "ok") {
            return true
        }
        return false
    } catch (error) {
        throw new AppError(500, "Failed to delete image from Cloudinary")
    }
}

export { uploadImage, deleteImage }