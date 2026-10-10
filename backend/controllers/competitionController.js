const Competition = require("../models/Competition");
const Question = require("../models/Question");
const { fetchOnlineQuestions } = require("../services/onlineQuestionService");
const { generateRoomCode } = require("../utils/codeGenerator");
const { shuffleArray } = require("../services/randomizerService");

// @desc    Create a multiplayer competition room
// @route   POST /api/competitions/create
// @access  Private
const createCompetition = async (req, res) => {
  try {
    const {
      title,
      subject,
      totalQuestions = 10,
      perQuestionTimeSeconds = 20,
      maxPlayers = 10,
    } = req.body;

    if (!title || !subject) {
      return res.status(400).json({ success: false, message: "Title and Subject are required" });
    }

    // Generate questions for this competition
    let questionPool = await Question.find({ subject: new RegExp(subject, "i") });

    if (questionPool.length < totalQuestions) {
      // Fetch online questions buffer
      const onlineQ = await fetchOnlineQuestions({
        subject,
        difficulty: "Mixed",
        count: totalQuestions,
      });

      for (const q of onlineQ) {
        let existing = await Question.findOne({ questionText: q.questionText });
        if (!existing) {
          existing = await Question.create({
            ...q,
            createdBy: req.user._id,
            source: "ONLINE",
          });
        }
        questionPool.push(existing);
      }
    }

    // Shuffle questions pool for distinct competition attempts
    const shuffledPool = shuffleArray(questionPool);
    const selectedQuestions = shuffledPool.slice(0, Number(totalQuestions)).map((q) => {
      const correctOpt = q.options.find((o) => o.isCorrect);
      const shuffledOptions = shuffleArray(q.options.map((o) => o.text));
      return {
        questionId: q._id,
        questionText: q.questionText,
        options: shuffledOptions,
        correctAnswer: correctOpt ? correctOpt.text : q.options[0].text,
        explanation: q.explanation || "",
        difficulty: q.difficulty || "Medium",
      };
    });

    const roomCode = generateRoomCode(subject);

    const competition = await Competition.create({
      roomCode,
      title,
      subject,
      host: req.user._id,
      maxPlayers: Number(maxPlayers),
      perQuestionTimeSeconds: Number(perQuestionTimeSeconds),
      currentQuestionIndex: -1,
      questions: selectedQuestions,
      players: [
        {
          user: req.user._id,
          name: req.user.name,
          isReady: true,
          score: 0,
        },
      ],
      status: "WAITING",
    });

    return res.status(201).json({
      success: true,
      message: "Competition created successfully!",
      data: competition,
    });
  } catch (error) {
    console.error("Create Competition Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get competition room details by Code
// @route   GET /api/competitions/code/:code
// @access  Private
const getCompetitionByCode = async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const competition = await Competition.findOne({ roomCode: code })
      .populate("host", "name role")
      .populate("players.user", "name avatar");

    if (!competition) {
      return res.status(404).json({ success: false, message: "Invalid competition code or room not found" });
    }

    // Sanitize questions (hide correctAnswer before and during game)
    const sanitizedCompetition = competition.toObject();
    if (sanitizedCompetition.status !== "COMPLETED") {
      sanitizedCompetition.questions = sanitizedCompetition.questions.map((q) => ({
        questionText: q.questionText,
        options: q.options,
        difficulty: q.difficulty,
      }));
    }

    return res.json({ success: true, data: sanitizedCompetition });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    List all recent or active competitions
// @route   GET /api/competitions
// @access  Private
const getCompetitions = async (req, res) => {
  try {
    const competitions = await Competition.find()
      .populate("host", "name")
      .select("-questions")
      .sort({ createdAt: -1 })
      .limit(20);

    return res.json({ success: true, data: competitions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCompetition,
  getCompetitionByCode,
  getCompetitions,
};
