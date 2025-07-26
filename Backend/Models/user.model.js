import mongoose from "mongoose"
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    last_known_location: {
        city: String,
        state: String,
        country: String
    }
}, {
    timestamps: true
});

export default mongoose.model('User', userSchema);