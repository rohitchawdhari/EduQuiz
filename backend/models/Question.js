const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    default: false,
  },
});

const questionSchema = new mongoose.Schema(
  {
    bankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuestionBank",
      default: null, // null for online fetched questions cache or standalone questions
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      index: true,
    },
    topic: {
      type: String,
      default: "General",
      trim: true,
      index: true,
    },
    questionText: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },
    questionType: {
      type: String,
      enum: ["MCQ", "TRUE_FALSE"],
      default: "MCQ",
    },
    options: {
      type: [optionSchema],
      validate: {
        validator: function (v) {
          return v && v.length >= 2;
        },
        message: "Question must have at least 2 options",
      },
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
      index: true,
    },
    marks: {
      type: Number,
      default: 1,
    },
    negativeMarks: {
      type: Number,
      default: 0,
    },
    explanation: {
      type: String,
      default: "",
    },
    source: {
      type: String,
      enum: ["BANK", "ONLINE", "MANUAL"],
      default: "MANUAL",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", questionSchema);
