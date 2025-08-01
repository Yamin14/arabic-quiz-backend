const authMiddleware = require('../middleware/authMiddleware');
const Question = require('../models/Question');
const { check, validationResult } = require('express-validator');
const express = require('express');

const router = express.Router();

//get all questions
router.get('/', authMiddleware, async (req, res) => {
    try {
        const questions = await Question.find();
        res.status(200).json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
})

//get question by id
router.get('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const question = await Question.findById(id);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        res.status(200).json(question);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
})

// create a question
router.post('/', [authMiddleware,
    check('text', 'Text is required').notEmpty(),
    check('options', 'Options are required').isArray({ min: 3, max: 5 }).withMessage('Options must be an array with 3 to 5 items'),
    check('category', 'Category is required').notEmpty()
], async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    //authorize user
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized to create a question" });
    }

    // Validate request body
    const { text, options, category, level } = req.body;
    if (!text || !options || options.length < 3 || !category) {
        return res.status(400).json({ message: 'Invalid input' });
    }

    //check if there is 1 correct answer in options
    const correctAnswers = options.filter(option => option.isCorrect);
    if (correctAnswers.length !== 1) {
        return res.status(400).json({ message: 'There must be exactly one correct answer in options' });
    }

    // Create a new question
    try {
        const newQuestion = new Question({
            text,
            options,
            category,
            level,
            user: req.user.id
        });

        const savedQuestion = await newQuestion.save();
        res.status(201).json(savedQuestion);

    } catch (error) {
        res.status(500).json({ message: `Server error, ${error.message}` });
    }

})


// create multiple question
router.post('/multiple', [authMiddleware,
    check('questions', 'Questions are required').isArray({ min: 1 }).withMessage('At least one question is required'),
    check('questions.*.text', 'Text is required').notEmpty(),
    check('questions.*.options', 'Options are required').isArray({ min: 3, max: 5 }).withMessage('Options must be an array with 3 to 5 items'),
    check('questions.*.category', 'Category is required').notEmpty()
], async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    //authorize user
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized to create a question" });
    }

    //check if there is 1 correct answer in options
    try {
        const questions = req.body.questions;
        const createdQuestions = [];

        await Promise.all(questions.map(async question => {
            const correctAnswers = question.options.filter(option => option.isCorrect);
            if (correctAnswers.length !== 1) {
                return res.status(400).json({ message: 'There must be exactly one correct answer in options' });
            }

            // Create new questions
            const { text, options, category, level } = question;

            const newQuestion = new Question({
                text,
                options,
                category,
                level: level ? level : 1,
                user: req.user.id
            });

            const savedQuestion = await newQuestion.save();
            createdQuestions.push(savedQuestion);
        })
        );
        res.status(201).json(createdQuestions);

    } catch (error) {
        return res.status(500).json({ message: `Server error, ${error.message}` });
    }
})

//edit a question
router.put('/:id', [authMiddleware,
    check('text', 'Text is required').notEmpty(),
    check('options', 'Options are required').isArray({ min: 3, max: 5 }).withMessage('Options must be an array with 3 to 5 items'),
    check('category', 'Category is required').notEmpty()
], async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    //authorize user
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized to edit a question" });
    }

    // Validate request body
    const { text, options, category, level } = req.body;
    if (!text || !options || options.length < 3 || !category) {
        return res.status(400).json({ message: 'Invalid input' });
    }

    //check if there is 1 correct answer in options
    const correctAnswers = options.filter(option => option.isCorrect);
    if (correctAnswers.length !== 1) {
        return res.status(400).json({ message: 'There must be exactly one correct answer in options' });
    }

    //get question by id
    const { id } = req.params;
    try {
        const question = await Question.findById(id);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        // Update question
        question.text = text;
        question.options = options;
        question.category = category;
        question.level = level || question.level; // keep existing level if not provided

        const updatedQuestion = await question.save();
        res.status(200).json(updatedQuestion);

    } catch (error) {
        res.status(500).json({ message: `Server error, ${error.message}` });
    }

})

//delete a question
router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    //check if user is authorized to delete the question
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized to delete this question" });
    }

    try {
        const question = await Question.findByIdAndDelete(id);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        res.status(200).json({ message: 'Question deleted successfully' });

    } catch (error) {
        res.status(500).json({ message: `Server error: ${error}` });
    }
})

module.exports = router;