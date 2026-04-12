/**
 * JobApplication controller – handles job application submission and admin management.
 *
 * `submitApplication` is the only public endpoint; all others require admin auth.
 * On submission:
 *  1. Validates the target job exists and is Active
 *  2. Rejects duplicate applications (same email + job)
 *  3. Increments the job's `applicationsCount` counter
 *
 * Exported functions:
 *  - submitApplication       POST   /api/v1/job-applications          (public)
 *  - getAllApplications       GET    /api/v1/job-applications          (admin, paginated)
 *  - getApplicationsByJob    GET    /api/v1/job-applications/job/:jobId (admin)
 *  - getApplicationById      GET    /api/v1/job-applications/:id      (admin)
 *  - updateApplicationStatus PATCH  /api/v1/job-applications/:id/status (admin)
 *  - deleteApplication       DELETE /api/v1/job-applications/:id      (admin)
 *  - getApplicationStats     GET    /api/v1/job-applications/stats    (admin)
 */
import asyncHandler from "../../middlewares/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import JobApplication from "../../models/usersModels/JobApplication.model.js";
import JobPosting from "../../models/usersModels/Jobs.model.js";
import User from "../../models/usersModels/User.model.js";
import { uploadFile } from "../../middlewares/Cloudinary.js";
import {
    sendJobApplicationConfirmation,
    sendJobApplicationAdminNotification,
} from "../../utils/sendEmails.js";
import { emitDataUpdate } from "../../utils/dataUpdateService.js";
import { notifyAdmins, createAndEmitNotification } from "../../utils/notificationService.js";

// =========================
// SUBMIT APPLICATION (public)
// =========================
export const submitApplication = asyncHandler(async (req, res) => {
    const {
        job,
        firstName,
        lastName,
        email,
        phone,
        desiredRole,
        experienceLevel,
        portfolioUrl,
        coverLetter,
    } = req.body;

    if (!job || !firstName || !lastName || !email) {
        throw new AppError("job, firstName, lastName and email are required", 400);
    }

    // Verify the job exists and is active
    const jobPosting = await JobPosting.findById(job);
    if (!jobPosting) throw new AppError("Job not found", 404);
    if (jobPosting.status !== "Active") throw new AppError("This position is no longer accepting applications", 400);

    // Check duplicate
    const existing = await JobApplication.findOne({ job, email });
    if (existing) throw new AppError("You have already applied for this position", 409);

    // Upload resume to Cloudinary if provided (non-blocking — failures don't abort submission)
    let resumeUrl = "";
    let resumePublicId = "";
    if (req.file?.path) {
        try {
            const uploaded = await uploadFile(req.file.path, "resumes");
            resumeUrl = uploaded.secure_url;
            resumePublicId = uploaded.public_id;
        } catch (uploadErr) {
            console.error("Resume upload to Cloudinary failed:", uploadErr.message);
            // Application proceeds without resume URL
        }
    }

    const application = await JobApplication.create({
        job,
        firstName,
        lastName,
        email,
        phone,
        desiredRole,
        experienceLevel,
        portfolioUrl,
        resumeUrl,
        resumePublicId,
        coverLetter,
    });

    // Increment applications count on the job
    await jobPosting.incrementApplications();

    // Notify admin dashboard in real-time
    const io = req.app.get("io");
    emitDataUpdate(io, "job-applications", ["admin:global"]);

    // Persist in-app notification for all admins (non-blocking)
    notifyAdmins(io, {
        type: "application_received",
        title: "New Job Application",
        message: `${firstName} ${lastName} applied for "${jobPosting.jobTitle}" (${jobPosting.department})`,
        payload: { applicationId: application._id, jobTitle: jobPosting.jobTitle, applicantEmail: email },
    }).catch(() => {});

    // Send confirmation email to applicant + admin notification (non-blocking)
    Promise.allSettled([
        sendJobApplicationConfirmation({
            to: email,
            name: firstName,
            jobTitle: jobPosting.jobTitle,
            department: jobPosting.department,
        }),
        sendJobApplicationAdminNotification({
            to: process.env.ADMIN_EMAIL || process.env.FROM_EMAIL,
            applicantName: `${firstName} ${lastName}`,
            applicantEmail: email,
            jobTitle: jobPosting.jobTitle,
            department: jobPosting.department,
            applicationId: application._id.toString(),
        }),
    ]).catch((err) => console.error("Email sending error:", err));

    successResponse(res, "Application submitted successfully", application, 201);
});

// =========================
// GET ALL APPLICATIONS (admin)
// =========================
export const getAllApplications = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, jobId, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {};
    if (status) filter.status = status;
    if (jobId) filter.job = jobId;
    if (search) {
        filter.$or = [
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
        ];
    }

    const [applications, total] = await Promise.all([
        JobApplication.find(filter)
            .populate("job", "jobTitle department")
            .populate("reviewedBy", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        JobApplication.countDocuments(filter),
    ]);

    successResponse(res, "Applications fetched successfully", {
        applications,
        pagination: {
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            limit: Number(limit),
        },
    });
});

// =========================
// GET APPLICATIONS BY JOB (admin)
// =========================
export const getApplicationsByJob = asyncHandler(async (req, res) => {
    const { jobId } = req.params;

    const applications = await JobApplication.find({ job: jobId })
        .populate("reviewedBy", "name email")
        .sort({ createdAt: -1 });

    successResponse(res, "Applications fetched", { applications, total: applications.length });
});

// =========================
// GET SINGLE APPLICATION (admin)
// =========================
export const getApplicationById = asyncHandler(async (req, res) => {
    const application = await JobApplication.findById(req.params.id)
        .populate("job", "jobTitle department location employmentType")
        .populate("reviewedBy", "name email");

    if (!application) throw new AppError("Application not found", 404);
    successResponse(res, "Application fetched", application);
});

// =========================
// UPDATE APPLICATION STATUS (admin)
// =========================
export const updateApplicationStatus = asyncHandler(async (req, res) => {
    const { status, adminNotes } = req.body;

    const validStatuses = ["pending", "reviewing", "shortlisted", "rejected", "hired"];
    if (!status || !validStatuses.includes(status)) {
        throw new AppError(`status must be one of: ${validStatuses.join(", ")}`, 400);
    }

    const application = await JobApplication.findByIdAndUpdate(
        req.params.id,
        {
            status,
            adminNotes,
            reviewedBy: req.user._id,
            reviewedAt: new Date(),
        },
        { new: true, runValidators: true }
    ).populate("job", "jobTitle department");

    if (!application) throw new AppError("Application not found", 404);

    // When hired: upgrade the applicant's user account role to 'team'
    let applicantUserId = null;
    if (status === "hired") {
        const user = await User.findOne({ email: application.email });
        if (user && user.role !== "admin") {
            user.role = "team";
            await user.save();
            applicantUserId = user._id.toString();
        }
    } else {
        const user = await User.findOne({ email: application.email }).select("_id");
        if (user) applicantUserId = user._id.toString();
    }

    // Notify admin + the applicant's user dashboard in real-time
    const io = req.app.get("io");
    const rooms = ["admin:global"];
    if (applicantUserId) rooms.push(`user:${applicantUserId}`);
    emitDataUpdate(io, "job-applications", rooms);

    // Persist in-app notification to the applicant if they have an account (non-blocking)
    if (applicantUserId) {
        const statusMessages = {
            reviewing:   `Your application for "${application.job?.jobTitle}" is now under review`,
            shortlisted: `Congratulations! You've been shortlisted for "${application.job?.jobTitle}"`,
            rejected:    `Your application for "${application.job?.jobTitle}" was not selected this time`,
            hired:       `Congratulations! You've been hired for "${application.job?.jobTitle}". Welcome to the team!`,
            pending:     `Your application for "${application.job?.jobTitle}" status has been updated`,
        };
        createAndEmitNotification(io, {
            recipientId: applicantUserId,
            type: "application_status_updated",
            title: status === "hired" ? "You're Hired!" : status === "shortlisted" ? "Shortlisted!" : "Application Update",
            message: statusMessages[status] || `Application status updated to ${status}`,
            payload: { applicationId: application._id, status, jobTitle: application.job?.jobTitle },
            createdBy: req.user._id,
        }).catch(() => {});
    }

    successResponse(res, "Application status updated", application);
});

// =========================
// DELETE APPLICATION (admin)
// =========================
export const deleteApplication = asyncHandler(async (req, res) => {
    const application = await JobApplication.findByIdAndDelete(req.params.id);
    if (!application) throw new AppError("Application not found", 404);

    const io = req.app.get("io");
    emitDataUpdate(io, "job-applications", ["admin:global"]);

    successResponse(res, "Application deleted successfully", {});
});

// =========================
// GET MY APPLICATIONS (authenticated user)
// =========================
export const getMyApplications = asyncHandler(async (req, res) => {
    const email = req.user.email;
    if (!email) throw new AppError("User email not found", 400);

    const applications = await JobApplication.find({ email })
        .populate("job", "jobTitle department location employmentType workMode salaryRange status")
        .sort({ createdAt: -1 });

    successResponse(res, "Your applications fetched successfully", { applications, total: applications.length });
});

// =========================
// GET STATS (admin)
// =========================
export const getApplicationStats = asyncHandler(async (req, res) => {
    const [statusStats, totalByJob] = await Promise.all([
        JobApplication.getStats(),
        JobApplication.aggregate([
            { $group: { _id: "$job", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "jobpostings",
                    localField: "_id",
                    foreignField: "_id",
                    as: "jobInfo",
                },
            },
            { $unwind: { path: "$jobInfo", preserveNullAndEmptyArrays: true } },
            { $project: { count: 1, jobTitle: "$jobInfo.jobTitle" } },
        ]),
    ]);

    const total = await JobApplication.countDocuments();

    successResponse(res, "Application stats fetched", { total, byStatus: statusStats, topJobs: totalByJob });
});
