import express from "express";
import {
    createReview,
    createAdminReview,
    getHomeReviews,
    getAllReviews,
    getAllReviewsAdmin,
    getReviewById,
    getReviewsByProject,
    getMyReviews,
    updateReview,
    updateAdminReview,
    updateReviewStatus,
    toggleShowOnHome,
    deleteReview,
    getReviewsByRating,
    getReviewStatistics,
    bulkDeleteReviews
} from "../../controllers/usersControllers/reviews.controller.js";

import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";

const router = express.Router();

// Public routes (no auth)
router.route("/home").get(getHomeReviews);
router.route("/all").get(getAllReviews);

// Admin-only routes (declare BEFORE /:id to avoid param collision)
router.route("/admin").post(userAuthenticated, authorizeRoles("admin"), createAdminReview);
router.route("/statistics").get(userAuthenticated, authorizeRoles("admin"), getReviewStatistics);
router.route("/bulk-delete").delete(userAuthenticated, authorizeRoles("admin"), bulkDeleteReviews);

// Authenticated user routes
router.route("/").post(userAuthenticated, createReview);
router.route("/").get(userAuthenticated, authorizeRoles("admin"), getAllReviewsAdmin);
router.route("/my-reviews").get(userAuthenticated, authorizeRoles("user", "admin", "team"), getMyReviews);
router.route("/rating/:rating").get(userAuthenticated, authorizeRoles("user", "admin"), getReviewsByRating);
router.route("/project/:projectId").get(userAuthenticated, authorizeRoles("user", "admin"), getReviewsByProject);

// Single review routes
router.route("/:id").get(userAuthenticated, authorizeRoles("user", "admin"), getReviewById);
router.route("/:id").put(userAuthenticated, authorizeRoles("user", "admin"), updateReview);
router.route("/:id/admin").put(userAuthenticated, authorizeRoles("admin"), updateAdminReview);
router.route("/:id/status").put(userAuthenticated, authorizeRoles("admin"), updateReviewStatus);
router.route("/:id/toggle-home").patch(userAuthenticated, authorizeRoles("admin"), toggleShowOnHome);
router.route("/:id").delete(userAuthenticated, authorizeRoles("user", "admin"), deleteReview);

export default router;
