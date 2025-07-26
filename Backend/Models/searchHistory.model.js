import mongoose from mongoose
const Schema = mongoose.Schema;

const searchHistorySchema = new Schema({
    query_text: {
        type: String,
        required: true,
        trim: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null // For guest users
    },
    session_id: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SearchHistory', searchHistorySchema);