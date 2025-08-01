const Question = require('../models/Question');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const express = require('express');
const { check, validationResult } = require('express-validator');
const { Query } = require('mongoose');
const router = express.Router();

//get quiz
router.get('/', authMiddleware, async (req, res) => {
    
    const { level, category } = req.query;
    
    try {
        const questions = await Question.find({ category });
        if (questions.length === 0) {
            return res.status(404).json({ message: 'No questions found for this category' });
        }

        const levelQuestions = questions.filter(q => q.level <= level);
        if (levelQuestions.length === 0) {
            return res.status(404).json({ message: 'No questions found for your level' });
        }

        //10 random questions
        const shuffled = [...levelQuestions];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i+1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const selectedQuestions = shuffled.slice(0, 10);

        selectedQuestions.forEach((question) => {
            for (let i = question.options.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [question.options[i], question.options[j]] = [question.options[j], question.options[i]];
            }
        });

        res.status(200).json(selectedQuestions);

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
})

//submit a quiz
router.put('/submit', [authMiddleware,
    check('score', 'Score is required').notEmpty()
], async (req, res) => {

    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { score } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the user's score
        user.points += score;
        user.quizzesTaken += 1;
        user.level = Math.floor(user.points / 50) + 1;
        user.quizHistory.push({
            score: score,
            date: new Date()
        });

        await user.save();
        res.status(200).json({ message: 'Quiz submitted successfully', user });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
})

module.exports = router;