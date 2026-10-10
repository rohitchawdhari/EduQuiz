const mongoose = require("mongoose");

const competitionPlayerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  socketId: {
    type: String,
    default: "",
  },
  isReady: {
    type: Boolean,
    default: false,
  },
  isFinished: {
    type: Boolean,
    default: false,
  },
  score: {
    type: Number,
    default: 0,
  },
  correctCount: {
    type: Number,
    default: 0,
  },
  wrongCount: {
    type: Number,
    default: 0,
  },
  totalTimeTakenSeconds: {
    type: Number,
    default: 0,
  },
  answers: [
    {
      questionIndex: Number,
      selectedOption: String,
      isCorrect: Boolean,
      timeTaken: Number,
      pointsEarned: Number,
    },
  ],
  rank: {
    type: Number,
    default: 0,
  },
});

const competitionSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["WAITING", "STARTING", "IN_PROGRESS", "QUESTION_ACTIVE", "QUESTION_ENDED", "COMPLETED"],
      default: "WAITING",
    },
    maxPlayers: {
      type: Number,
      default: 10,
      min: 2,
      max: 50,
    },
    perQuestionTimeSeconds: {
      type: Number,
      default: 20,
    },
    currentQuestionIndex: {
      type: Number,
      default: -1,
    },
    questions: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
        },
        questionText: String,
        options: [String],
        correctAnswer: String,
        explanation: String,
        difficulty: String,
      },
    ],
    players: [competitionPlayerSchema],
    winner: {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: String,
      score: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Competition", competitionSchema);
