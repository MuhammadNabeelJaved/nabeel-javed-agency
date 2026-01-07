import asyncHandler from "../../middlewares/asyncHandler.js"
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import validator from "validator";
import Service from "../../models/usersModels/Services.model.js";

// =========================
// CREATE SERVICE
// =========================

export const createService = asyncHandler(async (req, res) => {
    try {
        const {
            title,
            slug,
            subtitle,
            description,
            heroSection,
            relatedProjects,
            pricingPlans,
            faqs,
            features,
            technologies,
            metrics,
            ctaSection,
        } = req.body;

        if (!title || !slug || !description) {
            throw new AppError("Title, Slug, and Description are required", 400);
        }

        if (!validator.isSlug(slug)) {
            throw new AppError("Slug must be URL friendly", 400);
        }

        if (!subtitle && !heroSection && !relatedProjects && !pricingPlans && !faqs) {
            throw new AppError("At least one optional field must be provided", 400);
        }

        const service = await Service.create({
            title,
            slug,
            subtitle,
            description,
            heroSection,
            relatedProjects,
            pricingPlans,
            faqs,
        });

        successResponse(res, 201, "Service created successfully", service);
    } catch (error) {
        console.error("Error creating service:", error);
        throw new AppError(`Failed to create service: ${error.message}`, 500);

    }
});