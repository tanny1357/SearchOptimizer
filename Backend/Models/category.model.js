import mongoose from mongoose
const Schema = mongoose.Schema;

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    parentCategory: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        default: null // A null value indicates a top-level category
    },
    product: {
        type: Schema.Types.ObjectId,
        ref : 'product',
        required: true,
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);