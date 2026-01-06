import mongoose from 'mongoose';


// Review Schema
const reviewSchema = new mongoose.Schema({
    // Client Information
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },

    // Review Content
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5'],
        validate: {
            validator: Number.isInteger,
            message: 'Rating must be a whole number'
        }
    },
    reviewText: {
        type: String,
        required: [true, 'Review text is required'],
        trim: true,
        minlength: [10, 'Review must be at least 10 characters long'],
        maxlength: [1000, 'Review cannot exceed 1000 characters']
    },

    // Project Reference
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Project reference is required']
    },
    // Display Options
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

// Indexes for better query performance
reviewSchema.index({ rating: -1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ project: 1 });
reviewSchema.index({ isFeatured: 1, displayOrder: 1 });

// Virtual for star display
reviewSchema.virtual('stars').get(function () {
    return '⭐'.repeat(this.rating);
});

// Method to get review with project details
reviewSchema.methods.getFullReview = async function () {
    await this.populate('project');
    return this;
};


// Static method to get reviews by rating
reviewSchema.statics.getByRating = function (rating) {
    return this.find({
        rating: rating,
        status: 'approved'
    })
        .populate('project')
        .sort({ createdAt: -1 });
};

// Static method to get average rating for a project
reviewSchema.statics.getProjectAverageRating = async function (projectId) {
    const result = await this.aggregate([
        {
            $match: {
                project: mongoose.Types.ObjectId(projectId),
                status: 'approved'
            }
        },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 }
            }
        }
    ]);

    return result.length > 0 ? result[0] : { averageRating: 0, totalReviews: 0 };
};


const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

export default Review;