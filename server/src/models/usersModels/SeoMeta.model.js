import mongoose from 'mongoose';

const seoMetaSchema = new mongoose.Schema({
    page: {
        type: String,
        required: [true, 'Page key is required'],
        unique: true,
        trim: true,
        lowercase: true,
        index: true,
    },
    title: {
        type: String,
        trim: true,
        maxlength: [70, 'Title cannot exceed 70 characters'],
    },
    description: {
        type: String,
        trim: true,
        maxlength: [160, 'Description cannot exceed 160 characters'],
    },
    keywords: {
        type: String,
        trim: true,
        maxlength: [500, 'Keywords cannot exceed 500 characters'],
    },
    ogTitle: {
        type: String,
        trim: true,
        maxlength: [70, 'OG title cannot exceed 70 characters'],
    },
    ogDescription: {
        type: String,
        trim: true,
        maxlength: [200, 'OG description cannot exceed 200 characters'],
    },
    ogImage: {
        type: String,
        trim: true,
    },
    canonicalUrl: {
        type: String,
        trim: true,
    },
    noIndex: {
        type: Boolean,
        default: false,
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true });

const SeoMeta = mongoose.models.SeoMeta || mongoose.model('SeoMeta', seoMetaSchema);
export default SeoMeta;
