import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    }
},{timestamps:true});

export User = mongoose.model("User",UserSchema);