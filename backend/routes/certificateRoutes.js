const express = require("express");
const router = express.Router();
const Certificate = require("../models/Certificate");
const { protect } = require("../middleware/authMiddleware");

// Get all certificates for logged in user
router.get("/my-certificates", protect, async (req, res) => {
  try {
    const certs = await Certificate.find({ user: req.user._id })
      .populate("quiz", "title subject totalQuestions")
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: certs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get certificates earned by students for quizzes created by logged-in teacher
router.get("/teacher-student-certificates", protect, async (req, res) => {
  try {
    const Quiz = require("../models/Quiz");
    const teacherQuizzes = await Quiz.find({ createdBy: req.user._id }).select("_id");
    const quizIds = teacherQuizzes.map((q) => q._id);

    const certs = await Certificate.find({ quiz: { $in: quizIds } })
      .populate("user", "name email")
      .populate("quiz", "title subject totalQuestions")
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: certs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Verify certificate by ID (Public)
router.get("/verify/:id", async (req, res) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.id })
      .populate("user", "name")
      .populate("quiz", "title subject");

    if (!cert) {
      return res.status(404).json({ success: false, message: "Certificate not found or invalid ID" });
    }

    return res.json({ success: true, data: cert });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
