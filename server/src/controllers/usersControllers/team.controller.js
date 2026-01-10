import asyncHandler from "../../middlewares/asyncHandler.js"
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import validator from "validator";
import Team from "../../models/usersModels/Team.model.js"

// Get all active team members
export const getActiveTeamMembers = asyncHandler(async (req, res, next) => {
    try {
        const teamMembers = await Team.getActiveMembers();

        if (!teamMembers || teamMembers.length === 0) {
            throw new AppError("No active team members found", 404);
        }

        return successResponse(res, 200, "Active team members retrieved successfully", teamMembers);
    } catch (error) {
        console.error("Error in getActiveTeamMembers:", error);
        throw new AppError(`Failed to retrieve active team members: ${error.message}`, 500);
    }
});

// Get team members by department
export const getTeamMembersByDepartment = asyncHandler(async (req, res, next) => {
    try {
        const { department } = req.params;
        if (!department || !validator.isAlpha(department.replace(/\s+/g, ''))) {
            throw new AppError("Invalid department parameter", 400);
        }
        const teamMembers = await Team.getByDepartment(department);

        if (!teamMembers || teamMembers.length === 0) {
            throw new AppError(`No team members found in department: ${department}`, 404);
        }

        return successResponse(res, 200, `Team members in department: ${department} retrieved successfully`, teamMembers);
    } catch (error) {
        console.error("Error in getTeamMembersByDepartment:", error);
        throw new AppError(`Failed to retrieve team members in department: ${error.message}`, 500);
    }
});
