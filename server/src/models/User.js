import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";

const userSchema = new mongoose.Schema(
    {
        // =====================
        // BASIC INFORMATION
        // =====================
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [3, "Name must be at least 3 characters"],
            maxlength: [50, "Name cannot exceed 50 characters"],
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            validate: [validator.isEmail, "Please provide a valid email"],
            index: true,
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters"],
            select: false, // 🔐 never send password in queries
        },

        // =====================
        // ROLE BASED ACCESS
        // =====================
        role: {
            type: String,
            enum: ["admin", "team", "user"],
            default: "user",
        },

        permissions: {
            type: [String],
            default: [],
        },

        // =====================
        // ACCOUNT STATUS
        // =====================
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },

        isEmailVerified: {
            type: Boolean,
            default: false,
        },

        emailVerificationCode: {
            type: String,
            default: null,
        },

        emailVerificationExpires: {
            type: Date,
            default: null,
        },

        // =====================
        // SECURITY FIELDS
        // =====================
        passwordChangedAt: Date,

        passwordResetToken: String,
        passwordResetExpires: Date,

        // =====================

    },
    {
        timestamps: true,
        versionKey: false,
    }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 12);
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

userSchema.methods.comparePassword = async function (
    enteredPassword
) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTime = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        return JWTTimestamp < changedTime;
    }
    return false;
};

userSchema.pre(/^find/, function (next) {
    this.find({
        isActive: { $ne: false },
        deletedAt: null,
    });
    next();
});

const User = mongoose.model("User", userSchema);

export default User;

