const User = require("../models/User");
const Attempt = require("../models/Attempt");
const Competition = require("../models/Competition");

// @desc    Get Global Overall Leaderboard
// @route   GET /api/leaderboard/global
// @access  Public / Private
const getGlobalLeaderboard = async (req, res) => {
  try {
    const topUsers = await User.find({ role: "student" })
      .select("name avatar stats")
      .sort({ "stats.totalPoints": -1, "stats.averageScore": -1 })
      .limit(20);

    const formatted = topUsers.map((user, idx) => ({
      rank: idx + 1,
      id: user._id,
      name: user.name,
      avatar: user.avatar,
      totalPoints: user.stats.totalPoints || 0,
      averageScore: user.stats.averageScore || 0,
      quizzesAttempted: user.stats.quizzesAttempted || 0,
      competitionsWon: user.stats.competitionsWon || 0,
    }));

    return res.json({ success: true, data: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Subject-wise Leaderboard
// @route   GET /api/leaderboard/subject/:subject
// @access  Public / Private
const getSubjectLeaderboard = async (req, res) => {
  try {
    const { subject } = req.params;

    const attempts = await Attempt.aggregate([
      { $match: { status: { $in: ["SUBMITTED", "AUTO_SUBMITTED"] } } },
      {
        $lookup: {
          from: "quizzes",
          localField: "quizId",
          foreignField: "_id",
          as: "quiz",
        },
      },
      { $unwind: "$quiz" },
      { $match: { "quiz.subject": new RegExp(`^${subject}$`, "i") } },
      {
        $group: {
          _id: "$userId",
          avgScore: { $avg: "$percentage" },
          bestScore: { $max: "$score" },
          totalAttempts: { $sum: 1 },
        },
      },
      { $sort: { avgScore: -1 } },
      { $limit: 15 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
    ]);

    const formatted = attempts.map((item, idx) => ({
      rank: idx + 1,
      userId: item._id,
      name: item.user.name,
      averageScore: Math.round(item.avgScore),
      bestScore: item.bestScore,
      totalAttempts: item.totalAttempts,
    }));

    return res.json({ success: true, subject, data: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Multiplayer Competition Champions
// @route   GET /api/leaderboard/competitions
// @access  Public / Private
const getCompetitionLeaderboard = async (req, res) => {
  try {
    const topWinners = await User.find({ "stats.competitionsWon": { $gt: 0 } })
      .select("name avatar stats")
      .sort({ "stats.competitionsWon": -1, "stats.totalPoints": -1 })
      .limit(10);

    const formatted = topWinners.map((user, idx) => ({
      rank: idx + 1,
      name: user.name,
      competitionsWon: user.stats.competitionsWon || 0,
      competitionsPlayed: user.stats.competitionsPlayed || 0,
      winRate:
        user.stats.competitionsPlayed > 0
          ? Math.round((user.stats.competitionsWon / user.stats.competitionsPlayed) * 100)
          : 0,
    }));

    return res.json({ success: true, data: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getGlobalLeaderboard,
  getSubjectLeaderboard,
  getCompetitionLeaderboard,
};
