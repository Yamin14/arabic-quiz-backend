const express = require("express");
require("dotenv").config();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require("./config/connectDb");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const questionsRoute = require("./routes/questionsRoute");
const quizRoute = require("./routes/quizRoute");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/api/questions", questionsRoute);
app.use("/api/quiz", quizRoute);

// Connect to the database and start the server
connectDB().then(() => {
  console.log("Database connected successfully");
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
}).catch(err => {
  console.error("Database connection failed:", err);
  process.exit(1);
});
