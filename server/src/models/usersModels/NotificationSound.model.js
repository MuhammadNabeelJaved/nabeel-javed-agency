import mongoose from "mongoose";

const notificationSoundSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        fileUrl: {
            type: String,
            required: true,
            trim: true,
        },
        storage: {
            type: String,
            enum: ["local", "cloudinary", "external"],
            default: "local",
        },
        mimeType: {
            type: String,
            default: "audio/mpeg",
            trim: true,
        },
        originalFilename: {
            type: String,
            default: "",
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

notificationSoundSchema.index({ name: 1 });
notificationSoundSchema.index({ isActive: 1, createdAt: -1 });

const NotificationSound =
    mongoose.models.NotificationSound ||
    mongoose.model("NotificationSound", notificationSoundSchema);

export default NotificationSound;
