import mongoose from mongoose
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Add a static method to calculate average rating after a review is saved
reviewSchema.statics.calculateAverageRating = async function(productId) {
    const stats = await this.aggregate([
        {
            $match: { product: productId }
        },
        {
            $group: {
                _id: '$product',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    if (stats.length > 0) {
        await mongoose.model('Product').findByIdAndUpdate(productId, {
            avg_rating: stats[0].avgRating.toFixed(1)
        });
    } else {
         await mongoose.model('Product').findByIdAndUpdate(productId, {
            avg_rating: 0
        });
    }
};

// Hook to call the calculation after a review is saved
reviewSchema.post('save', function() {
    this.constructor.calculateAverageRating(this.product);
});

// Hook for findByIdAndUpdate and findByIdAndDelete
reviewSchema.post(/^findOneAnd/, async function(doc) {
    if (doc) {
        await doc.constructor.calculateAverageRating(doc.product);
    }
});


module.exports = mongoose.model('Review', reviewSchema);