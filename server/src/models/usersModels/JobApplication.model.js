import mongoose from "mongoose";

const jobApplicationSchema = new mongoose.Schema(
    {
        // Which job this is for
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "JobPosting",
            required: [true, "Job reference is required"],
            index: true,
        },

        // Personal Information
        firstName: {
            type: String,
            required: [true, "First name is required"],
            trim: true,
            maxlength: [50, "First name cannot exceed 50 characters"],
        },
        lastName: {
            type: String,
            required: [true, "Last name is required"],
            trim: true,
            maxlength: [50, "Last name cannot exceed 50 characters"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            lowercase: true,
            index: true,
            match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
        },
        phone: {
            type: String,
            trim: true,
            maxlength: [20, "Phone number cannot exceed 20 characters"],
        },

        // Role & Experience
        desiredRole: {
            type: String,
            trim: true,
            maxlength: [100, "Desired role cannot exceed 100 characters"],
        },
        experienceLevel: {
            type: String,
            enum: ["0-1 Years (Entry Level)", "1-3 Years", "3-5 Years", "5-10 Years", "10+ Years"],
            default: "0-1 Years (Entry Level)",
        },
        portfolioUrl: {
            type: String,
            trim: true,
            maxlength: [300, "Portfolio URL cannot exceed 300 characters"],
        },

        // Documents
        resumeUrl: {
            type: String,
            trim: true,
        },
        resumePublicId: {
            type: String, // Cloudinary public_id for deletion
            trim: true,
        },
        coverLetter: {
            type: String,
            trim: true,
            maxlength: [3000, "Cover letter cannot exceed 3000 characters"],
        },

        // Application Status
        status: {
            type: String,
            enum: ["pending", "reviewing", "shortlisted", "rejected", "hired"],
            default: "pending",
            index: true,
        },

        // Admin notes
        adminNotes: {
            type: String,
            trim: true,
            maxlength: [1000, "Admin notes cannot exceed 1000 characters"],
        },

        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        reviewedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Indexes
jobApplicationSchema.index({ job: 1, email: 1 }, { unique: true }); // one application per email per job
jobApplicationSchema.index({ status: 1, createdAt: -1 });

// Static: get all applications for a job
jobApplicationSchema.statics.getByJob = function (jobId) {
    return this.find({ job: jobId }).sort({ createdAt: -1 });
};

// Static: get stats
jobApplicationSchema.statics.getStats = async function () {
    return this.aggregate([
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
            },
        },
    ]);
};

const JobApplication =
    mongoose.models.JobApplication || mongoose.model("JobApplication", jobApplicationSchema);

export default JobApplication;
