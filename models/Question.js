const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true
    },
    options: [{
        text: {
            type: String,
            required: true,
            trim: true
        },
        isCorrect: {
            type: Boolean,
            default: false
        }
    }, { minItems: 3, maxItems: 5 }],
    category: {
        type: String,
        required: true,
        trim: true
    },
    level: {
        type: Number,
        default: 1
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    }
}, {timestamps: true});

const Question = mongoose.model("question", QuestionSchema);
module.exports = Question;