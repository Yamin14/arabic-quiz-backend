const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const config = require("config");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const { check, validationResult } = require("express-validator");
const express = require("express");

const router = express.Router();

//verify user
router.get('/user', authMiddleware, (req, res) => {
    res.status(200).json(req.user);
})

// login route
router.post("/login", [
    check("email").isEmail().withMessage("Valid email is required"),
    check("password").notEmpty().withMessage("Password is required")
], async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({ errors: result.array() });
    }

    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        //check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        //check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // create and assign a token
        const userData = {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            level: user.level,
            points: user.points,
            quizzesTaken: user.quizzesTaken
        };
        const token = jwt.sign(
            { user: userData },
            config.get("JWT_SECRET"),
            { expiresIn: '7d' }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Use secure cookies in production
            sameSite: "Strict" // Prevent CSRF attacks
        }).status(200).json(userData);

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }

})

//logout
router.post('/logout', (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Use secure cookies in production
            sameSite: "Strict"
        }).status(200).json({ message: "Successfully logged out!" })
    } catch (error) {
        res.status(500).json({ message: "Server error" })
    }
})

module.exports = router;