import mongoose from mongoose
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    product: {
        type: Schema.Types.ObjectId,
        ref : 'product',
        required: true,
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Brand', brandSchema);