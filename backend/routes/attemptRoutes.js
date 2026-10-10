const express = require("express");
const router = express.Router();
const {
  startAttempt,
  saveAnswer,
  logViolation,
  submitAttempt,
  getAttemptResult,
  getMyAttempts,
  getActiveAttempt,
} = require("../controllers/attemptController");
const { protect } = require("../middleware/authMiddleware");

router.get("/my-attempts", protect, getMyAttempts);
router.get("/active", protect, getActiveAttempt);
router.post("/start/:quizId", protect, startAttempt);
router.post("/:attemptId/save-answer", protect, saveAnswer);
router.post("/:attemptId/violation", protect, logViolation);
router.post("/:attemptId/submit", protect, submitAttempt);
router.get("/:attemptId/result", protect, getAttemptResult);

module.exports = router;
