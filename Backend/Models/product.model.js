import mongoose from mongoose
const Schema = mongoose.Schema;

const productSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true // Index for faster searching
    },
    description: {
        type: String,
        required: true
    },
    base_price: {
        type: Number,
        required: true,
        min: 0
    },
    discounted_price: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: function(value) {
                // 'this' refers to the document being validated
                return value <= this.base_price;
            },
            message: 'Discounted price cannot be greater than base price.'
        }
    },
    image_url: {
        type: String,
        required: true
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    brand: {
        type: Schema.Types.ObjectId,
        ref: 'Brand',
        required: true
    },
    stock_quantity: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    avg_rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    reviews: [{
      type: Schema.Types.ObjectId,
      ref: 'Review'
    }]
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

module.exports = mongoose.model('Product', productSchema);