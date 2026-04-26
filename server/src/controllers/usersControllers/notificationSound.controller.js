import asyncHandler from "../../middlewares/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import NotificationSound from "../../models/usersModels/NotificationSound.model.js";
import NotificationSoundRule from "../../models/usersModels/NotificationSoundRule.model.js";
import { uploadFile } from "../../middlewares/Cloudinary.js";

export const NOTIFICATION_SOUND_AUDIENCES = ["admin", "team", "user", "public"];

export const NOTIFICATION_SOUND_TYPES = [
    { value: "message", label: "Chat Message" },
    { value: "file_received", label: "Chat File Received" },
    { value: "project_accepted", label: "Project Accepted" },
    { value: "project_rejected", label: "Project Rejected" },
    { value: "project_assigned", label: "Project Assigned" },
    { value: "project_submitted", label: "Project Submitted" },
    { value: "status_updated", label: "Project Status Updated" },
    { value: "task_assigned", label: "Task Assigned" },
    { value: "ticket_submitted", label: "Ticket Submitted" },
    { value: "ticket_reply", label: "Ticket Reply" },
    { value: "ticket_status_updated", label: "Ticket Status Updated" },
    { value: "application_received", label: "Application Received" },
    { value: "application_status_updated", label: "Application Status Updated" },
    { value: "resource_added", label: "Resource Added" },
    { value: "user_registered", label: "User Registered" },
    { value: "live_chat_request", label: "Live Chat Request" },
];

const DEFAULT_SOUND_URL = "/notification-sounds/important-notification.mp3";

const DEFAULT_RULES = [
    { audience: "admin", notificationType: "message", label: "New client message", volume: 0.9 },
    { audience: "admin", notificationType: "file_received", label: "New client file", volume: 0.9 },
    { audience: "admin", notificationType: "application_received", label: "New job application", volume: 0.95 },
    { audience: "admin", notificationType: "ticket_submitted", label: "New support ticket", volume: 0.9 },
    { audience: "admin", notificationType: "live_chat_request", label: "New live chat request", volume: 1 },
    { audience: "admin", notificationType: "project_submitted", label: "New client project request", volume: 0.9 },
    { audience: "team", notificationType: "message", label: "New team chat message", volume: 0.85 },
    { audience: "team", notificationType: "file_received", label: "New team file", volume: 0.85 },
    { audience: "team", notificationType: "task_assigned", label: "Task assigned", volume: 0.85 },
    { audience: "team", notificationType: "project_assigned", label: "Project assigned", volume: 0.85 },
    { audience: "user", notificationType: "message", label: "New admin message", volume: 0.85 },
    { audience: "user", notificationType: "file_received", label: "New admin file", volume: 0.85 },
    { audience: "user", notificationType: "status_updated", label: "Project status updated", volume: 0.85 },
    { audience: "user", notificationType: "application_status_updated", label: "Application status updated", volume: 0.8 },
    { audience: "public", notificationType: "message", label: "New admin message", volume: 0.85 },
    { audience: "public", notificationType: "file_received", label: "New admin file", volume: 0.85 },
];

async function ensureDefaultSoundAndRules() {
    let defaultSound = await NotificationSound.findOne({ isDefault: true });

    if (!defaultSound) {
        defaultSound = await NotificationSound.create({
            name: "Important Notification",
            fileUrl: DEFAULT_SOUND_URL,
            storage: "local",
            mimeType: "audio/mpeg",
            originalFilename: "important-notification.mp3",
            isActive: true,
            isDefault: true,
        });
    }

    await Promise.all(
        DEFAULT_RULES.map((rule) =>
            NotificationSoundRule.findOneAndUpdate(
                { audience: rule.audience, notificationType: rule.notificationType },
                {
                    $setOnInsert: {
                        ...rule,
                        soundId: defaultSound._id,
                        isEnabled: true,
                        isImportant: true,
                        cooldownMs: 2500,
                    },
                },
                { upsert: true, new: true }
            )
        )
    );

    return defaultSound;
}

function normalizeRuleInput(body) {
    const audience = String(body.audience || "").trim();
    const notificationType = String(body.notificationType || "").trim();
    const soundId = String(body.soundId || "").trim();
    const label = String(body.label || "").trim();
    const isEnabled = body.isEnabled !== undefined ? body.isEnabled === true || body.isEnabled === "true" : true;
    const isImportant = body.isImportant !== undefined ? body.isImportant === true || body.isImportant === "true" : true;
    const volume = Math.max(0, Math.min(1, Number(body.volume ?? 0.85)));
    const cooldownMs = Math.max(0, Math.min(60000, Number(body.cooldownMs ?? 2500)));

    return { audience, notificationType, soundId, label, isEnabled, isImportant, volume, cooldownMs };
}

export const getMyNotificationSoundConfig = asyncHandler(async (req, res) => {
    await ensureDefaultSoundAndRules();

    const audience = req.user?.role === "admin" ? "admin" : req.user?.role === "team" ? "team" : "user";
    const audienceFilter = audience === "user" ? ["user", "public"] : [audience];

    const [sounds, rules] = await Promise.all([
        NotificationSound.find({ isActive: true }).sort({ isDefault: -1, createdAt: -1 }).lean(),
        NotificationSoundRule.find({ audience: { $in: audienceFilter }, isEnabled: true })
            .populate("soundId")
            .sort({ createdAt: -1 })
            .lean(),
    ]);

    successResponse(res, "Notification sound config fetched", {
        audience,
        sounds,
        rules: rules.filter((rule) => rule.soundId && rule.soundId.isActive),
    });
});

export const getAdminNotificationSoundData = asyncHandler(async (_req, res) => {
    await ensureDefaultSoundAndRules();

    const [sounds, rules] = await Promise.all([
        NotificationSound.find({}).populate("uploadedBy", "name role").sort({ isDefault: -1, createdAt: -1 }).lean(),
        NotificationSoundRule.find({}).populate("soundId").sort({ audience: 1, notificationType: 1 }).lean(),
    ]);

    successResponse(res, "Notification sound admin data fetched", {
        sounds,
        rules,
        notificationTypes: NOTIFICATION_SOUND_TYPES,
        audiences: NOTIFICATION_SOUND_AUDIENCES,
    });
});

export const createNotificationSound = asyncHandler(async (req, res) => {
    const name = String(req.body.name || "").trim();
    const manualUrl = String(req.body.fileUrl || "").trim();
    const isActive = req.body.isActive !== undefined ? req.body.isActive === true || req.body.isActive === "true" : true;

    if (!name) throw new AppError("Sound name is required", 400);
    if (!req.file && !manualUrl) throw new AppError("Audio file or sound URL is required", 400);

    let fileUrl = manualUrl;
    let storage = manualUrl ? (manualUrl.startsWith("/") ? "local" : "external") : "cloudinary";
    let mimeType = String(req.body.mimeType || "").trim() || "audio/mpeg";
    let originalFilename = String(req.body.originalFilename || "").trim();

    if (req.file) {
        const uploadResult = await uploadFile(req.file.path, "notification-sounds");
        fileUrl = uploadResult.secure_url;
        storage = "cloudinary";
        mimeType = req.file.mimetype;
        originalFilename = req.file.originalname;
    }

    const sound = await NotificationSound.create({
        name,
        fileUrl,
        storage,
        mimeType,
        originalFilename,
        isActive,
        uploadedBy: req.user?._id ?? null,
    });

    successResponse(res, "Notification sound created", sound, 201);
});

export const updateNotificationSound = asyncHandler(async (req, res) => {
    const sound = await NotificationSound.findById(req.params.id);
    if (!sound) throw new AppError("Sound not found", 404);

    const nextName = req.body.name !== undefined ? String(req.body.name || "").trim() : sound.name;
    if (!nextName) throw new AppError("Sound name is required", 400);

    sound.name = nextName;
    if (req.body.isActive !== undefined) sound.isActive = req.body.isActive === true || req.body.isActive === "true";

    const manualUrl = req.body.fileUrl !== undefined ? String(req.body.fileUrl || "").trim() : "";
    if (req.file) {
        const uploadResult = await uploadFile(req.file.path, "notification-sounds");
        sound.fileUrl = uploadResult.secure_url;
        sound.storage = "cloudinary";
        sound.mimeType = req.file.mimetype;
        sound.originalFilename = req.file.originalname;
    } else if (manualUrl) {
        sound.fileUrl = manualUrl;
        sound.storage = manualUrl.startsWith("/") ? "local" : "external";
    }

    await sound.save();

    successResponse(res, "Notification sound updated", sound);
});

export const deleteNotificationSound = asyncHandler(async (req, res) => {
    const sound = await NotificationSound.findById(req.params.id);
    if (!sound) throw new AppError("Sound not found", 404);
    if (sound.isDefault) throw new AppError("Default sound cannot be deleted", 400);

    const linkedRule = await NotificationSoundRule.findOne({ soundId: sound._id });
    if (linkedRule) throw new AppError("This sound is assigned to one or more notification rules", 400);

    await sound.deleteOne();
    successResponse(res, "Notification sound deleted");
});

export const createNotificationSoundRule = asyncHandler(async (req, res) => {
    const input = normalizeRuleInput(req.body);

    if (!NOTIFICATION_SOUND_AUDIENCES.includes(input.audience)) throw new AppError("Invalid audience", 400);
    if (!NOTIFICATION_SOUND_TYPES.some((item) => item.value === input.notificationType)) throw new AppError("Invalid notification type", 400);

    const sound = await NotificationSound.findById(input.soundId);
    if (!sound) throw new AppError("Sound not found", 404);

    const existingRule = await NotificationSoundRule.findOne({
        audience: input.audience,
        notificationType: input.notificationType,
    });
    if (existingRule) throw new AppError("A sound rule already exists for this audience and notification type", 400);

    const rule = await NotificationSoundRule.create({
        ...input,
        createdBy: req.user?._id ?? null,
    });

    await rule.populate("soundId");
    successResponse(res, "Notification sound rule created", rule, 201);
});

export const updateNotificationSoundRule = asyncHandler(async (req, res) => {
    const rule = await NotificationSoundRule.findById(req.params.id);
    if (!rule) throw new AppError("Rule not found", 404);

    const input = normalizeRuleInput(req.body);

    if (input.audience && !NOTIFICATION_SOUND_AUDIENCES.includes(input.audience)) throw new AppError("Invalid audience", 400);
    if (input.notificationType && !NOTIFICATION_SOUND_TYPES.some((item) => item.value === input.notificationType)) throw new AppError("Invalid notification type", 400);

    if (input.soundId) {
        const sound = await NotificationSound.findById(input.soundId);
        if (!sound) throw new AppError("Sound not found", 404);
        rule.soundId = input.soundId;
    }

    const nextAudience = input.audience || rule.audience;
    const nextType = input.notificationType || rule.notificationType;

    const duplicateRule = await NotificationSoundRule.findOne({
        _id: { $ne: rule._id },
        audience: nextAudience,
        notificationType: nextType,
    });
    if (duplicateRule) throw new AppError("A sound rule already exists for this audience and notification type", 400);

    rule.audience = nextAudience;
    rule.notificationType = nextType;
    rule.label = input.label;
    rule.isEnabled = input.isEnabled;
    rule.isImportant = input.isImportant;
    rule.volume = input.volume;
    rule.cooldownMs = input.cooldownMs;

    await rule.save();
    await rule.populate("soundId");

    successResponse(res, "Notification sound rule updated", rule);
});

export const deleteNotificationSoundRule = asyncHandler(async (req, res) => {
    const rule = await NotificationSoundRule.findById(req.params.id);
    if (!rule) throw new AppError("Rule not found", 404);

    await rule.deleteOne();
    successResponse(res, "Notification sound rule deleted");
});
