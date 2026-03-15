import mongoose from "mongoose";

// ─────────────────────────────────────────────
// Sub-schema: Tech Stack Item
// ─────────────────────────────────────────────
const techStackItemSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 50 },
        description: { type: String, trim: true, maxlength: 100 },
        iconKey: { type: String, trim: true, maxlength: 50 },       // e.g. "ReactIcon"
        colorClass: { type: String, trim: true, maxlength: 30 },    // e.g. "text-[#61DAFB]"
        order: { type: Number, default: 0 },
    },
    { _id: true }
);

// ─────────────────────────────────────────────
// Sub-schema: Tech Stack Category
// ─────────────────────────────────────────────
const techStackCategorySchema = new mongoose.Schema(
    {
        categoryName: { type: String, required: true, trim: true, maxlength: 80 },
        categoryDescription: { type: String, trim: true, maxlength: 200 },
        items: [techStackItemSchema],
    },
    { _id: true }
);

// ─────────────────────────────────────────────
// Sub-schema: Process Step (Concept to Reality)
// ─────────────────────────────────────────────
const processStepSchema = new mongoose.Schema(
    {
        stepTitle: { type: String, required: true, trim: true, maxlength: 80 },
        description: { type: String, trim: true, maxlength: 500 },
        iconName: { type: String, trim: true, maxlength: 50 },       // e.g. "Search"
        gradientColor: { type: String, trim: true, maxlength: 80 },  // e.g. "from-blue-500 to-cyan-400"
        bulletPoints: [{ type: String, trim: true, maxlength: 100 }],
        order: { type: Number, default: 0 },
    },
    { _id: true }
);

// ─────────────────────────────────────────────
// Sub-schema: Scrolling Card (Why Choose Us)
// ─────────────────────────────────────────────
const scrollingCardSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true, maxlength: 80 },
        description: { type: String, trim: true, maxlength: 300 },
        iconName: { type: String, trim: true, maxlength: 50 },
        order: { type: Number, default: 0 },
    },
    { _id: true }
);

// ─────────────────────────────────────────────
// Main CMS Schema
// ─────────────────────────────────────────────
const cmsSchema = new mongoose.Schema(
    {
        // Global Logo
        logoUrl: {
            type: String,
            trim: true,
            default: "",
        },

        // ── Tech Stack Section ──
        techStack: [techStackCategorySchema],

        // ── Concept to Reality Section ──
        conceptToReality: {
            sectionBadge: { type: String, trim: true, maxlength: 80, default: "Our Process" },
            sectionTitle: { type: String, trim: true, maxlength: 100, default: "From Concept to Reality" },
            steps: [processStepSchema],
        },

        // ── Why Choose Us Section ──
        whyChooseUs: {
            titleLine1: { type: String, trim: true, maxlength: 100, default: "Why forward-thinking companies" },
            titleLine2Highlighted: { type: String, trim: true, maxlength: 100, default: "choose us" },
            description: {
                type: String,
                trim: true,
                maxlength: 500,
                default: "We're not just a dev shop. We're your strategic partner in building digital products that stand out.",
            },
            keyPoints: [{ type: String, trim: true, maxlength: 150 }],
            scrollingCards: [scrollingCardSchema],
        },

        lastUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Singleton: ensure only one CMS document exists
cmsSchema.statics.getOrCreate = async function () {
    let doc = await this.findOne();
    if (!doc) {
        doc = await this.create({
            logoUrl: "",
            techStack: [],
            conceptToReality: { steps: [] },
            whyChooseUs: { keyPoints: [], scrollingCards: [] },
        });
    }
    return doc;
};

const CMS = mongoose.models.CMS || mongoose.model("CMS", cmsSchema);

export default CMS;
