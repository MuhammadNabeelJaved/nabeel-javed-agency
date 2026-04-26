import mongoose from 'mongoose';

const deliverableSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    fileUrl: { type: String, trim: true },
    isComplete: { type: Boolean, default: false },
}, { _id: true });

const milestoneSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
        index: true,
    },

    title: {
        type: String,
        required: [true, 'Milestone title is required'],
        trim: true,
        maxlength: [120, 'Title cannot exceed 120 characters'],
    },

    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },

    phase: {
        type: String,
        enum: ['Discovery', 'Design', 'Development', 'Testing', 'Launch'],
        required: true,
    },

    status: {
        type: String,
        enum: ['pending', 'in_progress', 'needs_approval', 'approved', 'rejected'],
        default: 'pending',
        index: true,
    },

    order: {
        type: Number,
        default: 0,
    },

    dueDate: {
        type: Date,
    },

    completedAt: {
        type: Date,
    },

    deliverables: [deliverableSchema],

    // Client approval fields
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    approvedAt: { type: Date },
    rejectionReason: { type: String, trim: true, maxlength: [500, 'Reason cannot exceed 500 characters'] },

    // Who created/updated
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

}, { timestamps: true, versionKey: false });

milestoneSchema.index({ project: 1, order: 1 });

const Milestone = mongoose.models.Milestone || mongoose.model('Milestone', milestoneSchema);
export default Milestone;
