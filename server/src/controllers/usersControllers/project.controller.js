import AppError from "../../utils/AppError.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import Project from "../../models/usersModels/Project.model.js";
import User from "../../models/usersModels/User.model.js";
import { successResponse } from "../../utils/apiResponse.js";
import { uploadImage, deleteImage } from "../../middlewares/Cloudinary.js";


// =========================
// CREATE PROJECT
// =========================
export const createProject = asyncHandler(async (req, res) => {
    try {
        const {
            projectName,
            projectType,
            budgetRange,
            projectDetails,
            // deadline,
            // totalCost
        } = req.body;
        const files = req.file?.path;


        if (!projectName || !projectDetails, !projectType || !budgetRange) {
            throw new AppError("All fields are required", 400);
        }
        const user = await User.findById(req?.user?.id);
        if (!user) {
            throw new AppError("User not found", 404);
        }

        // Handle file uploads
        let attachments = [];
        if (files && files.length > 0) {
            for (const file of files) {
                try {
                    const uploadResult = await uploadImage(file.path, "projects");
                    if (uploadResult && uploadResult.secure_url) {
                        // Determine file type
                        const fileType = file.mimetype.startsWith('image/') ? 'image'
                            : file.mimetype === 'application/pdf' ? 'pdf'
                                : file.mimetype.includes('document') ? 'doc'
                                    : 'other';

                        attachments.push({
                            fileName: file.originalname,
                            fileUrl: uploadResult.secure_url,
                            fileType: fileType
                        });
                    }
                } catch (error) {
                    console.error("File upload error:", error);
                    // Continue with other files even if one fails
                    throw new AppError("Failed to upload one of the files", error.message, 500);
                }
            }
        }



        const project = await Project.create({
            projectName,
            projectType,
            budgetRange,
            projectDetails,
            attachments: attachments,
        });
        successResponse(res, "Project created successfully", project, 201);
    } catch (error) {
        console.error("Error in createProject:", error);
        throw new AppError(`Failed to create project: ${error.message}`, 500);
    }
});