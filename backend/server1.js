const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

dotenv.config();

console.log("Starting server...");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB connection error:", err));

// User Schema to handle all fields for signup
const userSchema = new mongoose.Schema({
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    name: { type: String },
    semester: { type: Number },
    role: { type: String, enum: ["student", "faculty"] },
    gender: { type: String, enum: ["male", "female", "other"] },
    phoneNumber: { 
        type: String, 
        unique: true, 
        match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"]
    },
    email: { 
        type: String, 
        unique: true, 
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]
    },
    password: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

// Route to handle /register (with name, semester, and role only)
app.post("/register", async (req, res) => {
    try {
        const { name, semester, role } = req.body;

        // Validate required fields
        // if (!name || !semester || !role) {
        //     return res.status(400).json({ message: "All fields are required" });
        // }

        // // Check if role is valid
        // if (!["student", "faculty"].includes(role)) {
        //     return res.status(400).json({ message: "Invalid role" });
        // }

        // Create and save the new user
        const newUser = new User({ name, semester, role });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
});


// Route to handle /signup (with all fields)
app.post("/signup", async (req, res) => {
    try {
        const { firstName, lastName, gender, phoneNumber, email, password, semester, role } = req.body;

        // Validate required fields for signup
        if (!firstName || !lastName || !gender || !phoneNumber || !email || !password ||  !semester || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if email is already in use
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save the new user
        const newUser = new User({
            firstName,
            lastName,
            gender,
            phoneNumber,
            email,
            password: hashedPassword,
            name,
            semester,
            role
        });

        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
});

// Serve index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
