const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ==========================================
// CREATE JWT TOKEN
// ==========================================

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// ==========================================
// REGISTER
// POST /api/auth/register
// ==========================================

const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    // ----------------------------------------
    // Validation
    // ----------------------------------------

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    // ----------------------------------------
    // Check existing user
    // ----------------------------------------

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // ----------------------------------------
    // Create user
    // Password will automatically be hashed
    // by User.js pre-save middleware
    // ----------------------------------------

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });

    // ----------------------------------------
    // Generate token
    // ----------------------------------------

    const token =
      generateToken(user);

    // ----------------------------------------
    // Response
    // ----------------------------------------

    res.status(201).json({
      success: true,
      message: "Registration successful",

      data: {
        token,

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error(
      "❌ Register error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

// ==========================================
// LOGIN
// POST /api/auth/login
// ==========================================

const login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    // ----------------------------------------
    // Validation
    // ----------------------------------------

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    // ----------------------------------------
    // Find user
    // ----------------------------------------

    const user =
      await User.findOne({
        email: normalizedEmail,
      });

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    // ----------------------------------------
    // Compare password
    // Uses User.js method
    // ----------------------------------------

    const passwordMatch =
      await user.comparePassword(
        password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    // ----------------------------------------
    // Generate JWT
    // ----------------------------------------

    const token =
      generateToken(user);

    // ----------------------------------------
    // Response
    // ----------------------------------------

    res.json({
      success: true,
      message: "Login successful",

      data: {
        token,

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error(
      "❌ Login error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

// ==========================================
// GET CURRENT USER
// GET /api/auth/me
// ==========================================

const getMe = async (req, res) => {
  try {
    const user =
      await User.findById(
        req.user.id
      ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(
      "❌ Get current user error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch current user",
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
};