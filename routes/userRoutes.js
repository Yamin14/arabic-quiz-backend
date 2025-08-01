const User = require("../models/User");
const express = require("express");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authMiddleware");
require("dotenv").config();

const router = express.Router();

// Get users for dashboard
router.get("/", authMiddleware, async (req, res) => {
    const { classCode } = req.user;
    try {
        const users = await User.find({classCode, role: 'student'})
        .sort({points: -1})
        .select("-password");
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
})

// Get all users
router.get("/all", authMiddleware, async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
})

// Get user by ID
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
})

// Create a new user
router.post("/", [
    check("name").notEmpty().withMessage("Name is required"),
    check("email").isEmail().withMessage("Valid email is required"),
    check("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long")
], async (req, res) => {

    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({ errors: result.array() });
    }

    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // create new user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ name, email, password: hashedPassword, role: role || 'student'});
        await newUser.save();

        // create and assign a token
        const savedUser = {
            id: newUser._id, email: newUser.email, name: newUser.name, role: newUser.role, level: 1, points: 0, quizzesTaken: 0
        }
        const token = jwt.sign(
            { user: savedUser },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Use secure cookies in production
            sameSite: "Strict" // Prevent CSRF attacks
        }).status(200).json(savedUser);

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
})

// update a user
router.put("/:id", [authMiddleware,
    check("name").notEmpty().withMessage("Name is required"),
], async (req, res) => {

    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({ errors: result.array() });
    }

    //validate request body
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: "All fields are required" });
    }

    //check if user is authorized to update
    const { id } = req.params;
    if (req.user.role !== 'admin' && req.user.id !== id) {
        return res.status(403).json({ message: "Unauthorized to update this user" });
    }

    try {
        // get user
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // update user
        user.name = name;
        await user.save();

        res.status(200).json(user);

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
})

// delete user by ID
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        //check if user exists
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        //check if current user is authorized to delete
        if (req.user.role !== 'admin' && req.user.id !== id) {
            return res.status(403).json({ message: "Unauthorized to delete this user" });
        }

        await User.findByIdAndDelete(id);
        res.status(204).json({ message: "User deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
})

module.exports = router;