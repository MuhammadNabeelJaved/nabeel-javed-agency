import AppError from "../../utils/AppError.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import Project from "../../models/usersModels/Project.model.js";
import User from "../../models/usersModels/User.model.js";
import { successResponse } from "../../utils/apiResponse.js";


// =========================
// CREATE PROJECT
// =========================
export const createProject = asyncHandler(async (req, res) => {
    try {
        const { projectName, projectDetails, totalCost, deadline } = req.body;
        const file = req.file?.path;


        if (!projectName || !projectDetails || !totalCost || !deadline) {
            throw new AppError("All fields are required", 400);
        }
        const user = await User.findById(req.user.id);
        if (!user) {
            throw new AppError("User not found", 404);
        }

        // Upload file handling can be added here if needed
        


        const project = await Project.create({
            projectName,
            projectDetails,
            totalCost,
            deadline,
            user: req.user.id,
            file: file,
        });
        successResponse(res, "Project created successfully", project, 201);
    } catch (error) {
        console.error("Error in createProject:", error);
        throw new AppError(`Failed to create project: ${error.message}`, 500);
    }
});