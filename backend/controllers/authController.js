const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const {
  sendWelcomeEmail,
  sendLoginNotification,
  sendPasswordResetEmail,
} = require("../services/emailService");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "eduquiz_jwt_fallback_secret", {
    expiresIn: "7d",
  });
};

// Seed default accounts if they don't exist
const seedDefaultAccounts = async () => {
  try {
    const admin = await User.findOne({ email: "admin@eduquiz.com" });
    if (!admin) {
      await User.create({
        name: "EduQuiz Super Admin",
        email: "admin@eduquiz.com",
        password: "password123",
        role: "admin",
      });
      console.log("🛡️ Default Admin created: admin@eduquiz.com / password123");
    } else {
      const match = await admin.matchPassword("password123");
      if (!match) {
        admin.password = "password123";
        admin.role = "admin";
        await admin.save();
        console.log("🛡️ Default Admin password synced to: password123");
      }
    }

    const teacher = await User.findOne({ email: "teacher@eduquiz.com" });
    if (!teacher) {
      await User.create({
        name: "Prof. Test Teacher",
        email: "teacher@eduquiz.com",
        password: "password123",
        role: "teacher",
      });
      console.log("🎓 Default Teacher created: teacher@eduquiz.com / password123");
    } else {
      const match = await teacher.matchPassword("password123");
      if (!match) {
        teacher.password = "password123";
        teacher.role = "teacher";
        await teacher.save();
      }
    }

    const student = await User.findOne({ email: "student@eduquiz.com" });
    if (!student) {
      await User.create({
        name: "Student User",
        email: "student@eduquiz.com",
        password: "password123",
        role: "student",
      });
      console.log("🎒 Default Student created: student@eduquiz.com / password123");
    } else {
      const match = await student.matchPassword("password123");
      if (!match) {
        student.password = "password123";
        student.role = "student";
        await student.save();
      }
    }
  } catch (err) {
    console.error("Account seed check:", err.message);
  }
};
seedDefaultAccounts();

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Please enter all required fields" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: "An account with this email already exists" });
    }

    // SECURITY FIX: Public registration allows ONLY 'student' or 'teacher'
    // 'admin' accounts cannot be created via public registration!
    const assignedRole = role === "teacher" ? "teacher" : "student";

    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
    });

    if (user) {
      // Dispatch Welcome Email asynchronously (non-blocking)
      sendWelcomeEmail({
        to: user.email,
        name: user.name,
        role: user.role,
      }).catch((err) => console.error("Welcome email delivery notice:", err.message));

      return res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          stats: user.stats,
          token: generateToken(user._id),
        },
      });
    } else {
      return res.status(400).json({ success: false, message: "Invalid user data provided" });
    }
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password" });
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      // Dispatch Login Security Alert asynchronously (non-blocking)
      const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
      sendLoginNotification({
        to: user.email,
        name: user.name,
        ip: clientIp,
        time: new Date(),
      }).catch((err) => console.error("Login notification delivery notice:", err.message));

      return res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          stats: user.stats,
          token: generateToken(user._id),
        },
      });
    } else {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    return res.json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.name = req.body.name || user.name;
    if (req.body.avatar !== undefined) {
      user.avatar = req.body.avatar;
    }

    await user.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        stats: user.stats,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Please provide current and new password" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password does not match" });
    }

    user.password = newPassword;
    await user.save();

    return res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot password (generates reset token)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Don't leak user existence in production
      return res.json({
        success: true,
        message: "If that email is registered, password reset instructions have been generated.",
      });
    }

    // Generate random 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = crypto.createHash("sha256").update(resetCode).digest("hex");
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    // Dispatch Password Reset Email with 6-digit verification code asynchronously
    sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetCode,
    }).catch((err) => console.error("Password reset email delivery notice:", err.message));

    // For smooth user feedback, confirm dispatch and provide code
    return res.json({
      success: true,
      message: "Password reset code sent to your registered email! Valid for 15 minutes.",
      demoResetCode: resetCode,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset password using reset code
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;
    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({ success: false, message: "Please provide email, reset code, and new password" });
    }

    const hashedToken = crypto.createHash("sha256").update(String(resetCode).trim()).digest("hex");

    const user = await User.findOne({
      email,
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset code" });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return res.json({ success: true, message: "Password reset successful! You may now login." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
