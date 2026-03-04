import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
    },
    profileImage: {
        type: String,
        default: "",
    },
    clerkId: {
        type: String,
        required: true,
        unique: true,
    },
},
    {timestamps: true } //created at and updated at automatically added by mongoose
);

const User = mongoose.model("User", userSchema);

export default User;