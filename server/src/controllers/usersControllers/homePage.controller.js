import HomePage from "../../models/usersModels/HomePageHero.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";

// Create or Update Home Page Content

// =========================
// CREATE HOME PAGE CONTENT (First time only)
// =========================
export const createHomePage = asyncHandler(async (req, res) => {
    try {
        const { statusBadge, titleLine1, titleLine2, subtitle } = req.body;

        // Check if content already exists
        const existingHomePage = await HomePage.findOne({});
        if (existingHomePage) {
            throw new AppError(
                "Home page content already exists. Use update endpoint to modify it.",
                400
            );
        }

        // All fields are required for creation
        if (!statusBadge || !titleLine1 || !titleLine2 || !subtitle) {
            throw new AppError(
                "All fields are required: statusBadge, titleLine1, titleLine2, and subtitle",
                400
            );
        }

        const homePage = await HomePage.create({
            statusBadge,
            titleLine1,
            titleLine2,
            subtitle,
            lastUpdatedBy: req.user._id,
        });

        successResponse(
            res,
            "Home page content created successfully",
            homePage,
            201
        );
    } catch (error) {
        console.error("Error creating home page content:", error.message);
        throw new AppError("Failed to create home page content", 500);
    }
});

// =========================
// UPDATE HOME PAGE CONTENT (Partial updates allowed)
// =========================
export const updateHomePage = asyncHandler(async (req, res) => {
    try {
        const { statusBadge, titleLine1, titleLine2, subtitle } = req.body;

        // Check if home page exists
        const homePage = await HomePage.findOne({});
        if (!homePage) {
            throw new AppError(
                "Home page content not found. Please create it first.",
                404
            );
        }

        // At least one field should be provided
        const hasUpdates = statusBadge || titleLine1 || titleLine2 || subtitle;
        if (!hasUpdates) {
            throw new AppError(
                "At least one field is required to update",
                400
            );
        }

        // Update only provided fields
        if (statusBadge !== undefined) homePage.statusBadge = statusBadge;
        if (titleLine1 !== undefined) homePage.titleLine1 = titleLine1;
        if (titleLine2 !== undefined) homePage.titleLine2 = titleLine2;
        if (subtitle !== undefined) homePage.subtitle = subtitle;
        homePage.lastUpdatedBy = req.user._id;

        await homePage.save();

        successResponse(
            res,
            "Home page content updated successfully",
            homePage,
            200
        );
    } catch (error) {
        console.error("Error updating home page content:", error.message);
        throw new AppError("Failed to update home page content", 500);
    }
});