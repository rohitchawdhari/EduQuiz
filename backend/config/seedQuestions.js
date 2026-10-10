const Question = require("../models/Question");
const Quiz = require("../models/Quiz");
const seedComprehensiveQuizzes = require("./seedComprehensiveQuizzes");

const seedQuestionsIfEmpty = async () => {
  try {
    const qCount = await Question.countDocuments();
    const quizCount = await Quiz.countDocuments();
    if (qCount < 280 || quizCount < 14) {
      console.log("🌱 Checking and ensuring comprehensive syllabus quizzes...");
      await seedComprehensiveQuizzes();
    }
  } catch (err) {
    console.error("Question seeding notice:", err.message);
  }
};

module.exports = seedQuestionsIfEmpty;
