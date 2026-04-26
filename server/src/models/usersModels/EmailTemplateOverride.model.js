import mongoose from 'mongoose';

const emailTemplateOverrideSchema = new mongoose.Schema({
    originalFile: {
        type: String,
        default: null,
    },

    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },

    description: {
        type: String,
        trim: true,
        maxlength: 300,
    },

    bestFor: {
        type: String,
        default: 'custom',
    },

    suggestedSubject: {
        type: String,
        trim: true,
        maxlength: 200,
    },

    placeholders: {
        type: [String],
        default: [],
    },

    html: {
        type: String,
        required: true,
    },

    isCustom: {
        type: Boolean,
        default: false,
    },

    aiGenerated: {
        type: Boolean,
        default: false,
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

}, { timestamps: true, versionKey: false });

const EmailTemplateOverride = mongoose.models.EmailTemplateOverride
    || mongoose.model('EmailTemplateOverride', emailTemplateOverrideSchema);

export default EmailTemplateOverride;
