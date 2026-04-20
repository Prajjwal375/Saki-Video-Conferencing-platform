import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
    {
        name:       { type: String, required: true },
        username:   { type: String, required: true, unique: true },
        password:   { type: String, required: false, default: null },
        token:      { type: String },
        googleId:   { type: String, default: null },
        avatar:     { type: String, default: null },   // Google profile picture
        authProvider: { type: String, default: "local", enum: ["local", "google"] }
    }
)

const User = mongoose.model("User", userSchema);

export { User };