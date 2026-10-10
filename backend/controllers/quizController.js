const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const QuestionBank = require("../models/QuestionBank");
const { fetchOnlineQuestions } = require("../services/onlineQuestionService");
const { selectRandomQuestions } = require("../services/randomizerService");

// @desc    Generate / Create a Quiz
// @route   POST /api/quizzes/create
// @access  Private
const createQuiz = async (req, res) => {
  try {
    const {
      title,
      description,
      sourceType, // 'ONLINE' or 'BANK'
      bankId,
      subject,
      topic,
      difficulty, // 'Easy' | 'Medium' | 'Hard' | 'Mixed'
      difficultyDistribution, // { easy: 10, medium: 7, hard: 3 }
      totalQuestions = 10,
      durationMinutes = 15,
      marksPerQuestion = 2,
      negativeMarks = 0.5,
      shuffleQuestions = true,
      shuffleOptions = true,
      passingPercentage = 40,
    } = req.body;

    if (!title || !subject) {
      return res.status(400).json({ success: false, message: "Title and Subject are required" });
    }

    let questionsPool = [];

    if (sourceType === "BANK") {
      if (!bankId) {
        return res.status(400).json({ success: false, message: "Please specify a question bank" });
      }

      // Check bank
      const bank = await QuestionBank.findById(bankId);
      if (!bank) {
        return res.status(404).json({ success: false, message: "Selected Question Bank not found" });
      }

      // Query bank questions
      const query = { bankId };
      if (topic && topic !== "All Topics") {
        query.topic = topic;
      }
      questionsPool = await Question.find(query);

      if (questionsPool.length === 0) {
        return res.status(400).json({
          success: false,
          message: `The question bank "${bank.title}" has no questions yet. Please add questions first.`,
        });
      }
    } else if (sourceType === "AI") {
      // Direct Google Gemini AI Generation
      const { generateQuestionsWithAI } = require("../services/aiQuestionService");
      const aiRes = await generateQuestionsWithAI({
        subject,
        topic: topic || "Core",
        difficulty: difficulty === "Mixed" ? "Medium" : difficulty,
        count: Number(totalQuestions) || 5,
      });

      if (aiRes.success && aiRes.questions.length > 0) {
        const savedQuestions = [];
        for (const q of aiRes.questions) {
          let existing = await Question.findOne({ questionText: q.questionText });
          if (!existing) {
            existing = await Question.create({
              ...q,
              createdBy: req.user._id,
              source: "ONLINE",
            });
          }
          savedQuestions.push(existing);
        }
        questionsPool = savedQuestions;
      } else {
        // Fallback to existing subject pool
        questionsPool = await Question.find({ subject: new RegExp(`^${subject}$`, "i") });
      }
    } else {
      // ONLINE source: Fetch or query cached questions
      const onlineFetched = await fetchOnlineQuestions({
        subject,
        difficulty,
        count: totalQuestions * 2, // fetch buffer
      });

      // Save questions in DB cache if not already stored
      const savedQuestions = [];
      for (const q of onlineFetched) {
        let existing = await Question.findOne({
          questionText: q.questionText,
          subject: q.subject,
        });
        if (!existing) {
          existing = await Question.create({
            ...q,
            createdBy: req.user._id,
            source: "ONLINE",
          });
        }
        savedQuestions.push(existing);
      }
      questionsPool = savedQuestions;
    }

    // Apply Randomization & Difficulty filter
    const selectionResult = selectRandomQuestions(questionsPool, {
      count: Number(totalQuestions),
      difficulty,
      distribution: difficultyDistribution,
    });

    if (!selectionResult.success && selectionResult.questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: selectionResult.warning || selectionResult.message,
      });
    }

    const selectedQuestionIds = selectionResult.questions.map((q) => q._id);

    const quiz = await Quiz.create({
      title,
      description: description || "",
      sourceType: sourceType || "ONLINE",
      bankId: bankId || null,
      subject,
      topic: topic || "All Topics",
      difficulty,
      difficultyDistribution: difficultyDistribution || {},
      totalQuestions: selectedQuestionIds.length,
      durationMinutes: Number(durationMinutes),
      marksPerQuestion: Number(marksPerQuestion),
      negativeMarks: Number(negativeMarks),
      shuffleQuestions: shuffleQuestions !== false,
      shuffleOptions: shuffleOptions !== false,
      passingPercentage: Number(passingPercentage),
      questions: selectedQuestionIds,
      createdBy: req.user._id,
      isTeacherAssigned: req.user.role === "teacher" || req.user.role === "admin",
    });

    // Populate creator info
    await quiz.populate("createdBy", "name role email");

    return res.status(201).json({
      success: true,
      message: "Quiz created successfully!",
      warning: selectionResult.warning || null,
      data: quiz,
    });
  } catch (error) {
    console.error("Create Quiz Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all available quizzes
// @route   GET /api/quizzes
// @access  Public / Private
const getQuizzes = async (req, res) => {
  try {
    const { subject, difficulty, search } = req.query;
    let query = { isPublic: true };

    if (subject && subject !== "All") {
      query.subject = new RegExp(`^${subject}$`, "i");
    }

    if (difficulty && difficulty !== "All") {
      query.difficulty = difficulty;
    }

    if (search) {
      query.$or = [
        { title: new RegExp(search, "i") },
        { subject: new RegExp(search, "i") },
        { topic: new RegExp(search, "i") },
        { description: new RegExp(search, "i") },
      ];
    }

    const quizzes = await Quiz.find(query)
      .populate("createdBy", "name role")
      .select("-questions") // do not send question details on browse list
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: quizzes.length, data: quizzes });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single quiz details before starting
// @route   GET /api/quizzes/:id
// @access  Private
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate("createdBy", "name role")
      .select("-questions"); // questions delivered via startAttempt to prevent inspect element cheating!

    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }

    return res.json({ success: true, data: quiz });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a quiz
// @route   DELETE /api/quizzes/:id
// @access  Private (Teacher/Admin)
const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }

    if (req.user.role !== "admin" && quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this quiz" });
    }

    await Quiz.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: "Quiz deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createQuiz,
  getQuizzes,
  getQuizById,
  deleteQuiz,
};
