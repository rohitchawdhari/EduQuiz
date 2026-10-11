const User = require("../models/User");
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const Attempt = require("../models/Attempt");
const Competition = require("../models/Competition");
const QuestionBank = require("../models/QuestionBank");

// @desc    Get Admin Overview Analytics
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalTeachers = await User.countDocuments({ role: "teacher" });
    const totalAdmins = await User.countDocuments({ role: "admin" });
    const totalBlocked = await User.countDocuments({ isBlocked: true });

    const totalQuizzes = await Quiz.countDocuments();
    const totalQuestions = await Question.countDocuments();
    const totalAttempts = await Attempt.countDocuments();
    const totalCompetitions = await Competition.countDocuments();
    const totalBanks = await QuestionBank.countDocuments();

    // Average platform score
    const avgScoreAgg = await Attempt.aggregate([
      { $match: { status: { $in: ["SUBMITTED", "AUTO_SUBMITTED"] } } },
      { $group: { _id: null, avgPercentage: { $avg: "$percentage" } } },
    ]);
    const platformAvgScore = avgScoreAgg.length > 0 ? Math.round(avgScoreAgg[0].avgPercentage) : 0;

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalAdmins,
        totalBlocked,
        totalQuizzes,
        totalQuestions,
        totalAttempts,
        totalCompetitions,
        totalBanks,
        platformAvgScore,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users list with search and filter
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get specific user's detailed activity & history
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Get all quiz attempts taken by this user
    const attempts = await Attempt.find({ userId: user._id })
      .populate("quizId", "title subject difficulty totalQuestions passPercentage")
      .sort({ createdAt: -1 });

    // Get all quizzes created by this user (if teacher)
    const quizzesCreated = await Quiz.find({ creator: user._id })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: {
        user,
        attempts,
        quizzesCreated,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle block/unblock user
// @route   PUT /api/admin/users/:id/block
// @access  Private (Admin)
const toggleBlockUser = async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: "Security Warning: You cannot suspend/block your own administrator account",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === "admin" && !user.isBlocked) {
      const adminCount = await User.countDocuments({ role: "admin", isBlocked: false });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot suspend the only active administrator",
        });
      }
    }

    user.isBlocked = !user.isBlocked;
    if (user.isBlocked) {
      user.blockedReason = req.body.reason || "Suspended by platform administrator";
    } else {
      user.blockedReason = "";
    }

    await user.save();

    return res.json({
      success: true,
      message: user.isBlocked
        ? `Account for ${user.name} has been suspended`
        : `Account for ${user.name} has been reactivated`,
      data: {
        _id: user._id,
        isBlocked: user.isBlocked,
        blockedReason: user.blockedReason,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change user role (student, teacher, admin)
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["student", "teacher", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role specified" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Protect last remaining admin
    if (user.role === "admin" && role !== "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot change role of the last remaining administrator",
        });
      }
    }

    user.role = role;
    await user.save();

    return res.json({
      success: true,
      message: `Role for ${user.name} changed to ${role}`,
      data: {
        _id: user._id,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: "Security Warning: You cannot delete your own administrator account",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Security Warning: Cannot delete the last remaining administrator account",
        });
      }
    }

    // Clean up attempts by this user
    await Attempt.deleteMany({ userId: user._id });
    await User.findByIdAndDelete(req.params.id);

    return res.json({ success: true, message: `User ${user.name} permanently removed from platform` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all quizzes on the platform for admin oversight
// @route   GET /api/admin/quizzes
// @access  Private (Admin)
const getAllQuizzesAdmin = async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .populate("creator", "name email role")
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: quizzes.length, data: quizzes });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete any quiz (Admin content moderation)
// @route   DELETE /api/admin/quizzes/:id
// @access  Private (Admin)
const deleteQuizAdmin = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }

    await Question.deleteMany({ quizId: quiz._id });
    await Attempt.deleteMany({ quizId: quiz._id });
    await Quiz.findByIdAndDelete(req.params.id);

    return res.json({ success: true, message: `Quiz "${quiz.title}" and associated data deleted` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get platform-wide recent quiz attempts (Audit Activity Log)
// @route   GET /api/admin/attempts
// @access  Private (Admin)
const getAllAttemptsAdmin = async (req, res) => {
  try {
    const attempts = await Attempt.find({
      status: { $in: ["SUBMITTED", "AUTO_SUBMITTED"] },
    })
      .populate("userId", "name email role avatar")
      .populate("quizId", "title subject difficulty passPercentage")
      .sort({ submittedAt: -1 })
      .limit(60);

    return res.json({ success: true, count: attempts.length, data: attempts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  getUserDetails,
  toggleBlockUser,
  changeUserRole,
  deleteUser,
  getAllQuizzesAdmin,
  deleteQuizAdmin,
  getAllAttemptsAdmin,
};
