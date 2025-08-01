const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
        });
    } catch (error) {
        console.error("Error connecting to the database:", error.message);
        process.exit(1);
    }
}

module.exports = connectDB;