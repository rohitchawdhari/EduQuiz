const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Quiz title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    sourceType: {
      type: String,
      enum: ["ONLINE", "BANK", "CUSTOM", "AI"],
      default: "ONLINE",
    },
    bankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuestionBank",
      default: null,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      default: "All Topics",
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard", "Mixed"],
      default: "Mixed",
    },
    difficultyDistribution: {
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 },
    },
    questionType: {
      type: String,
      enum: ["ALL", "MCQ", "TRUE_FALSE"],
      default: "ALL",
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: [1, "Quiz must have at least 1 question"],
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: [1, "Duration must be at least 1 minute"],
      default: 15,
    },
    marksPerQuestion: {
      type: Number,
      default: 2,
    },
    negativeMarks: {
      type: Number,
      default: 0.5,
    },
    shuffleQuestions: {
      type: Boolean,
      default: true,
    },
    shuffleOptions: {
      type: Boolean,
      default: true,
    },
    passingPercentage: {
      type: Number,
      default: 40,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    isTeacherAssigned: {
      type: Boolean,
      default: false,
      index: true,
    },
    totalAttempts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", quizSchema);
