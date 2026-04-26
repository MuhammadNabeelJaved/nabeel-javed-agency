import mongoose from "mongoose";

const notificationSoundRuleSchema = new mongoose.Schema(
    {
        audience: {
            type: String,
            enum: ["admin", "team", "user", "public"],
            required: true,
        },
        notificationType: {
            type: String,
            required: true,
            trim: true,
        },
        soundId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "NotificationSound",
            required: true,
        },
        label: {
            type: String,
            default: "",
            trim: true,
        },
        isEnabled: {
            type: Boolean,
            default: true,
        },
        isImportant: {
            type: Boolean,
            default: true,
        },
        volume: {
            type: Number,
            default: 0.85,
            min: 0,
            max: 1,
        },
        cooldownMs: {
            type: Number,
            default: 2500,
            min: 0,
            max: 60000,
        },
        createdBy: {
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

notificationSoundRuleSchema.index({ audience: 1, notificationType: 1 }, { unique: true });
notificationSoundRuleSchema.index({ audience: 1, isEnabled: 1 });

const NotificationSoundRule =
    mongoose.models.NotificationSoundRule ||
    mongoose.model("NotificationSoundRule", notificationSoundRuleSchema);

export default NotificationSoundRule;
