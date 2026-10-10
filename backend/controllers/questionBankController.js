const QuestionBank = require("../models/QuestionBank");
const Question = require("../models/Question");
const { parseQuestionFile } = require("../services/excelImportService");

// @desc    Create a new question bank
// @route   POST /api/banks
// @access  Private (Teacher/Admin)
const createBank = async (req, res) => {
  try {
    const { title, subject, description, isPublic } = req.body;

    if (!title || !subject) {
      return res.status(400).json({ success: false, message: "Title and Subject are required" });
    }

    const bank = await QuestionBank.create({
      title,
      subject,
      description: description || "",
      isPublic: isPublic !== undefined ? isPublic : true,
      createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, data: bank });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get question banks
// @route   GET /api/banks
// @access  Private
const getBanks = async (req, res) => {
  try {
    const { subject } = req.query;
    let query = {};

    // Teachers see their own banks or public banks
    if (req.user.role === "admin") {
      // admin sees all
    } else {
      query = {
        $or: [{ createdBy: req.user._id }, { isPublic: true }],
      };
    }

    if (subject) {
      query.subject = new RegExp(subject, "i");
    }

    const banks = await QuestionBank.find(query)
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: banks });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single bank with its questions
// @route   GET /api/banks/:id
// @access  Private
const getBankById = async (req, res) => {
  try {
    const bank = await QuestionBank.findById(req.params.id).populate("createdBy", "name role");
    if (!bank) {
      return res.status(404).json({ success: false, message: "Question bank not found" });
    }

    const questions = await Question.find({ bankId: bank._id }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: {
        bank,
        questions,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload CSV/Excel file into question bank
// @route   POST /api/banks/:id/upload
// @access  Private (Teacher/Admin)
const uploadToBank = async (req, res) => {
  try {
    const bank = await QuestionBank.findById(req.params.id);
    if (!bank) {
      return res.status(404).json({ success: false, message: "Question bank not found" });
    }

    // Permission check
    if (req.user.role !== "admin" && bank.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to modify this bank" });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: "Please upload an Excel or CSV file" });
    }

    const { questions: parsedQuestions, errors, totalParsed } = parseQuestionFile(req.file.buffer);

    if (parsedQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid questions could be parsed from the file",
        errors,
      });
    }

    // Attach bankId and subject to each question
    const questionsToInsert = parsedQuestions.map((q) => ({
      ...q,
      bankId: bank._id,
      subject: bank.subject,
      createdBy: req.user._id,
      source: "BANK",
    }));

    const inserted = await Question.insertMany(questionsToInsert);

    // Update total questions count in QuestionBank
    bank.totalQuestions += inserted.length;
    await bank.save();

    return res.json({
      success: true,
      message: `Successfully imported ${inserted.length} questions!`,
      totalImported: inserted.length,
      errors: errors.length > 0 ? errors : null,
      data: inserted,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add single question manually to bank
// @route   POST /api/banks/:id/questions
// @access  Private (Teacher/Admin)
const addManualQuestion = async (req, res) => {
  try {
    const bank = await QuestionBank.findById(req.params.id);
    if (!bank) {
      return res.status(404).json({ success: false, message: "Question bank not found" });
    }

    const { questionText, options, difficulty, marks, negativeMarks, explanation, topic } = req.body;

    if (!questionText || !options || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Question text and at least 2 options are required",
      });
    }

    // Check if at least one correct option exists
    const hasCorrect = options.some((opt) => opt.isCorrect === true);
    if (!hasCorrect) {
      return res.status(400).json({
        success: false,
        message: "At least one option must be marked as correct",
      });
    }

    const question = await Question.create({
      bankId: bank._id,
      subject: bank.subject,
      topic: topic || "General",
      questionText,
      options,
      difficulty: difficulty || "Medium",
      marks: marks || 1,
      negativeMarks: negativeMarks || 0,
      explanation: explanation || "",
      createdBy: req.user._id,
      source: "BANK",
    });

    bank.totalQuestions += 1;
    await bank.save();

    return res.status(201).json({ success: true, data: question });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a question bank
// @route   PUT /api/banks/:id
// @access  Private (Teacher/Admin)
const updateBank = async (req, res) => {
  try {
    const bank = await QuestionBank.findById(req.params.id);
    if (!bank) return res.status(404).json({ success: false, message: "Bank not found" });

    if (req.user.role !== "admin" && bank.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    bank.title = req.body.title || bank.title;
    bank.subject = req.body.subject || bank.subject;
    bank.description = req.body.description !== undefined ? req.body.description : bank.description;
    await bank.save();

    return res.json({ success: true, message: "Question bank updated", data: bank });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a question bank and its questions
// @route   DELETE /api/banks/:id
// @access  Private (Teacher/Admin)
const deleteBank = async (req, res) => {
  try {
    const bank = await QuestionBank.findById(req.params.id);
    if (!bank) return res.status(404).json({ success: false, message: "Bank not found" });

    if (req.user.role !== "admin" && bank.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await Question.deleteMany({ bankId: bank._id });
    await QuestionBank.findByIdAndDelete(req.params.id);

    return res.json({ success: true, message: "Question bank and questions deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete single question
// @route   DELETE /api/banks/questions/:questionId
// @access  Private (Teacher/Admin)
const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);
    if (!question) return res.status(404).json({ success: false, message: "Question not found" });

    if (question.bankId) {
      await QuestionBank.findByIdAndUpdate(question.bankId, { $inc: { totalQuestions: -1 } });
    }

    await Question.findByIdAndDelete(req.params.questionId);
    return res.json({ success: true, message: "Question deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update single question
// @route   PUT /api/banks/questions/:questionId
// @access  Private (Teacher/Admin)
const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);
    if (!question) return res.status(404).json({ success: false, message: "Question not found" });

    const { questionText, options, difficulty, marks, negativeMarks, explanation } = req.body;

    if (questionText) question.questionText = questionText;
    if (options && options.length >= 2) question.options = options;
    if (difficulty) question.difficulty = difficulty;
    if (marks !== undefined) question.marks = Number(marks);
    if (negativeMarks !== undefined) question.negativeMarks = Number(negativeMarks);
    if (explanation !== undefined) question.explanation = explanation;

    await question.save();
    return res.json({ success: true, message: "Question updated successfully", data: question });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBank,
  getBanks,
  getBankById,
  uploadToBank,
  addManualQuestion,
  updateBank,
  deleteBank,
  deleteQuestion,
  updateQuestion,
};
