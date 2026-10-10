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

// @desc    Get all users list
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.json({ success: true, count: users.length, data: users });
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

    await User.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  deleteUser,
};
