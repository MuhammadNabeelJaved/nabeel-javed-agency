import SeoMeta from '../../models/usersModels/SeoMeta.model.js';
import asyncHandler from '../../middlewares/asyncHandler.js';
import AppError from '../../utils/AppError.js';
import { successResponse } from '../../utils/apiResponse.js';

// GET /api/v1/seo — all pages (public)
export const getAllSeoMeta = asyncHandler(async (req, res) => {
    const pages = await SeoMeta.find().sort({ page: 1 }).lean();
    successResponse(res, 'SEO meta fetched', pages);
});

// GET /api/v1/seo/:page — single page (public)
export const getSeoMetaByPage = asyncHandler(async (req, res) => {
    const page = await SeoMeta.findOne({ page: req.params.page.toLowerCase() }).lean();
    // Return empty object rather than 404 — missing entry = no custom meta
    successResponse(res, 'SEO meta fetched', page || {});
});

// PUT /api/v1/seo/:page — upsert (admin)
export const upsertSeoMeta = asyncHandler(async (req, res) => {
    const { title, description, keywords, ogTitle, ogDescription, ogImage, canonicalUrl, noIndex } = req.body;

    const pageKey = req.params.page.toLowerCase();

    const meta = await SeoMeta.findOneAndUpdate(
        { page: pageKey },
        {
            page: pageKey,
            title, description, keywords,
            ogTitle, ogDescription, ogImage,
            canonicalUrl, noIndex,
            updatedBy: req.user._id,
        },
        { upsert: true, new: true, runValidators: true }
    );

    successResponse(res, 'SEO meta saved', meta);
});

// DELETE /api/v1/seo/:page — reset to defaults (admin)
export const deleteSeoMeta = asyncHandler(async (req, res) => {
    await SeoMeta.findOneAndDelete({ page: req.params.page.toLowerCase() });
    successResponse(res, 'SEO meta reset to defaults', null);
});

// GET /api/v1/seo/bulk — batch upsert (admin)
export const bulkUpsertSeoMeta = asyncHandler(async (req, res) => {
    const { pages } = req.body;
    if (!Array.isArray(pages) || pages.length === 0) {
        throw new AppError('pages array is required', 400);
    }

    const ops = pages.map(p => ({
        updateOne: {
            filter: { page: p.page.toLowerCase() },
            update: { $set: { ...p, page: p.page.toLowerCase(), updatedBy: req.user._id } },
            upsert: true,
        },
    }));

    await SeoMeta.bulkWrite(ops);
    successResponse(res, 'Bulk SEO meta saved', null);
});
