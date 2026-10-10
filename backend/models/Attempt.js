const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  },
  selectedOptionIndex: {
    type: Number,
    default: null, // null if unanswered / skipped
  },
  isCorrect: {
    type: Boolean,
    default: null,
  },
  marksAwarded: {
    type: Number,
    default: 0,
  },
  timeSpentSeconds: {
    type: Number,
    default: 0,
  },
  isMarkedForReview: {
    type: Boolean,
    default: false,
  },
});

const violationSchema = new mongoose.Schema({
  type: {
    type: String, // 'TAB_SWITCH', 'FULLSCREEN_EXIT', 'RIGHT_CLICK', 'KEY_STROKE'
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  details: String,
});

const attemptSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Array of questions in randomized order with shuffled option mappings for this attempt
    orderedQuestions: [
      {
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
        },
        shuffledOptions: [
          {
            text: String,
            originalIndex: Number,
          },
        ],
      },
    ],
    answers: [answerSchema],
    status: {
      type: String,
      enum: ["IN_PROGRESS", "SUBMITTED", "AUTO_SUBMITTED", "TERMINATED_CHEATING"],
      default: "IN_PROGRESS",
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    deadline: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
    },
    timeTakenSeconds: {
      type: Number,
      default: 0,
    },
    violations: [violationSchema],
    violationCount: {
      type: Number,
      default: 0,
    },
    // Calculated score fields
    score: {
      type: Number,
      default: 0,
    },
    maxScore: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    correctCount: {
      type: Number,
      default: 0,
    },
    wrongCount: {
      type: Number,
      default: 0,
    },
    skippedCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attempt", attemptSchema);
