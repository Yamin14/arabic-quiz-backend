const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    points: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 1
    },
    quizzesTaken: {
        type: Number,
        default: 0
    },
    quizHistory: [
        {
            score: {
                type: Number,
                required: true
            },
            quizDate: {
                type: Date,
                default: Date.now
            }
        }
    ],
    role: {
        type: String,
        enum: ["student", "admin"],
        default: "student"
    },
    classCode: {
        type: String
    }
}, {timestamps: true});

const User = mongoose.model("user", UserSchema);
module.exports = User;