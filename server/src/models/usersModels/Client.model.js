import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
    {
        // Basic info
        companyName: {
            type: String,
            required: [true, "Company name is required"],
            trim: true,
            maxlength: [150, "Company name cannot exceed 150 characters"],
            index: true,
        },
        contactName: {
            type: String,
            trim: true,
            maxlength: [100, "Contact name cannot exceed 100 characters"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            lowercase: true,
            unique: true,
            index: true,
            match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
        },
        phone: {
            type: String,
            trim: true,
            maxlength: [20, "Phone cannot exceed 20 characters"],
        },

        // Classification
        industry: {
            type: String,
            trim: true,
            maxlength: [80, "Industry cannot exceed 80 characters"],
        },
        status: {
            type: String,
            enum: ["Active", "Inactive", "Onboarding", "Churned"],
            default: "Active",
            index: true,
        },

        // Relationship
        accountManager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            index: true,
        },

        // Optional metadata
        website: {
            type: String,
            trim: true,
        },
        notes: {
            type: String,
            trim: true,
            maxlength: [1000, "Notes cannot exceed 1000 characters"],
        },
        logoUrl: {
            type: String,
            trim: true,
        },

        // Aggregated counters (updated externally)
        totalRevenue: {
            type: Number,
            default: 0,
            min: 0,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        isArchived: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Virtual: active projects count is computed via Project collection, not stored here

clientSchema.index({ companyName: "text", contactName: "text", email: "text" });

const Client = mongoose.models.Client || mongoose.model("Client", clientSchema);

export default Client;
