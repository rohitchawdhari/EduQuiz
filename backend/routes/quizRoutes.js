const express = require("express");
const router = express.Router();
const {
  createQuiz,
  getQuizzes,
  getQuizById,
  deleteQuiz,
} = require("../controllers/quizController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.route("/")
  .get(getQuizzes)
  .post(protect, createQuiz);

// Authenticated users (students, teachers, admins) can generate / create quizzes
router.post("/create", protect, createQuiz);
router.get("/:id", protect, getQuizById);
router.delete("/:id", protect, authorize("teacher", "admin"), deleteQuiz);

module.exports = router;
