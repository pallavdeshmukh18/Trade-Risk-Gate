import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    passwordHash: String,
    role: {
        type: String,
        enum: ["ADMIN", "TRADER", "VIEWER"],
        default: "TRADER"
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company"
    },
    watchlist: {
        type: [String],
        default: []
    }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
