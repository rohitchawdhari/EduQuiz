const Attempt = require("../models/Attempt");
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const User = require("../models/User");
const Certificate = require("../models/Certificate");
const { shuffleArray } = require("../services/randomizerService");
const { generateCertificateId } = require("../utils/codeGenerator");
const {
  sendQuizResultEmail,
  sendCertificateEmail,
} = require("../services/emailService");

// @desc    Start an exam attempt (Creates sanitized question snapshot or resumes active exam)
// @route   POST /api/attempts/start/:quizId
// @access  Private
const startAttempt = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId).populate("questions");

    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }

    // 1. CHECK FOR ACTIVE IN-PROGRESS ATTEMPT (Resumption across refresh / re-login)
    const activeAttempt = await Attempt.findOne({
      quizId: quiz._id,
      userId: req.user._id,
      status: "IN_PROGRESS",
      deadline: { $gt: new Date() },
    }).populate("orderedQuestions.question");

    if (activeAttempt) {
      // Reconstruct client-sanitized questions with the exact attempt question order & option order
      const clientSanitizedQuestions = [];
      activeAttempt.orderedQuestions.forEach((oq, index) => {
        const q = oq.question;
        if (!q) return;
        clientSanitizedQuestions.push({
          index,
          questionId: q._id,
          questionText: q.questionText,
          subject: q.subject,
          topic: q.topic,
          difficulty: q.difficulty,
          marks: quiz.marksPerQuestion || q.marks || 2,
          negativeMarks: quiz.negativeMarks || q.negativeMarks || 0,
          options: oq.shuffledOptions.map((opt, clientIdx) => ({
            clientIndex: clientIdx,
            text: opt.text,
          })),
        });
      });

      const remainingSeconds = Math.max(
        0,
        Math.round((activeAttempt.deadline.getTime() - Date.now()) / 1000)
      );

      // Pre-map saved answers
      const savedAnswersMap = {};
      (activeAttempt.answers || []).forEach((a) => {
        savedAnswersMap[a.questionId.toString()] = {
          selectedOptionIndex: a.selectedOptionIndex,
          isMarkedForReview: a.isMarkedForReview,
        };
      });

      return res.status(200).json({
        success: true,
        resumed: true,
        message: "Resumed active examination session",
        data: {
          attemptId: activeAttempt._id,
          quiz: {
            _id: quiz._id,
            title: quiz.title,
            subject: quiz.subject,
            durationMinutes: quiz.durationMinutes,
            totalQuestions: clientSanitizedQuestions.length,
            marksPerQuestion: quiz.marksPerQuestion,
            negativeMarks: quiz.negativeMarks,
          },
          questions: clientSanitizedQuestions,
          savedAnswers: savedAnswersMap,
          startTime: activeAttempt.startTime,
          deadline: activeAttempt.deadline,
          remainingSeconds,
        },
      });
    }

    // 2. FRESH ATTEMPT: GATHER CANDIDATE QUESTION POOL
    let candidatePool = [];

    if (quiz.sourceType === "BANK" && quiz.bankId) {
      candidatePool = await Question.find({ bankId: quiz.bankId });
    } else {
      candidatePool = await Question.find({
        subject: new RegExp(`^${quiz.subject}$`, "i"),
      });
    }

    // Include any questions explicitly attached to the Quiz document
    if (quiz.questions && quiz.questions.length > 0) {
      const existingIds = new Set(candidatePool.map((q) => q._id.toString()));
      quiz.questions.forEach((q) => {
        if (q && q._id && !existingIds.has(q._id.toString())) {
          candidatePool.push(q);
          existingIds.add(q._id.toString());
        }
      });
    }

    if (candidatePool.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No validated questions currently available in pool for ${quiz.subject}. Please check back shortly.`,
      });
    }

    // 3. RECENT-QUESTION AVOIDANCE & USER QUESTION HISTORY
    // Query question IDs seen in user's previous attempts for this subject/quiz
    const pastAttempts = await Attempt.find({
      userId: req.user._id,
      quizId: quiz._id,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("orderedQuestions.question")
      .lean();

    const recentlySeenIds = new Set();
    pastAttempts.forEach((att) => {
      if (Array.isArray(att.orderedQuestions)) {
        att.orderedQuestions.forEach((oq) => {
          if (oq.question) {
            recentlySeenIds.add(oq.question.toString());
          }
        });
      }
    });

    const unseenQuestions = candidatePool.filter(
      (q) => !recentlySeenIds.has(q._id.toString())
    );
    const seenQuestions = candidatePool.filter((q) =>
      recentlySeenIds.has(q._id.toString())
    );

    const neededCount = Math.min(quiz.totalQuestions || 20, candidatePool.length);
    let selectedQuestions = [];

    if (unseenQuestions.length >= neededCount) {
      // Pick exclusively unseen questions, randomized
      selectedQuestions = shuffleArray(unseenQuestions).slice(0, neededCount);
    } else {
      // Use all unseen questions, then fill remaining count from seen questions randomized
      selectedQuestions = [...unseenQuestions];
      const remainingNeeded = neededCount - unseenQuestions.length;
      const shuffledSeen = shuffleArray(seenQuestions);
      selectedQuestions.push(...shuffledSeen.slice(0, remainingNeeded));
    }

    // Shuffle the final selected question order
    if (quiz.shuffleQuestions !== false) {
      selectedQuestions = shuffleArray(selectedQuestions);
    }

    // 4. PREPARE ATTEMPT SNAPSHOT & SHUFFLE OPTIONS INDEPENDENTLY
    const orderedQuestions = [];
    const clientSanitizedQuestions = [];

    selectedQuestions.forEach((q, index) => {
      // Map options with their original index to verify answers accurately upon submit
      let mappedOptions = q.options.map((opt, originalIdx) => ({
        text: opt.text,
        originalIndex: originalIdx,
      }));

      if (quiz.shuffleOptions !== false) {
        mappedOptions = shuffleArray(mappedOptions);
      }

      orderedQuestions.push({
        question: q._id,
        shuffledOptions: mappedOptions,
      });

      // Sanitized client view: no answers, strictly text
      clientSanitizedQuestions.push({
        index,
        questionId: q._id,
        questionText: q.questionText,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        marks: quiz.marksPerQuestion || q.marks || 2,
        negativeMarks: quiz.negativeMarks || q.negativeMarks || 0,
        options: mappedOptions.map((opt, clientIdx) => ({
          clientIndex: clientIdx,
          text: opt.text,
        })),
      });
    });

    const now = new Date();
    const durationMs = (quiz.durationMinutes || 20) * 60 * 1000;
    const deadline = new Date(now.getTime() + durationMs);

    const attempt = await Attempt.create({
      quizId: quiz._id,
      userId: req.user._id,
      orderedQuestions,
      answers: [],
      startTime: now,
      deadline,
      status: "IN_PROGRESS",
    });

    // Increment quiz total attempts count
    quiz.totalAttempts = (quiz.totalAttempts || 0) + 1;
    await quiz.save();

    return res.status(201).json({
      success: true,
      resumed: false,
      data: {
        attemptId: attempt._id,
        quiz: {
          _id: quiz._id,
          title: quiz.title,
          subject: quiz.subject,
          durationMinutes: quiz.durationMinutes,
          totalQuestions: clientSanitizedQuestions.length,
          marksPerQuestion: quiz.marksPerQuestion,
          negativeMarks: quiz.negativeMarks,
        },
        questions: clientSanitizedQuestions,
        savedAnswers: {},
        startTime: attempt.startTime,
        deadline: attempt.deadline,
        remainingSeconds: (quiz.durationMinutes || 20) * 60,
      },
    });
  } catch (error) {
    console.error("Start Attempt Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Auto-save or update an answer during active exam
// @route   POST /api/attempts/:attemptId/save-answer
// @access  Private
const saveAnswer = async (req, res) => {
  try {
    const { questionId, selectedClientIndex, isMarkedForReview, timeSpentSeconds } = req.body;
    const attempt = await Attempt.findOne({
      _id: req.params.attemptId,
      userId: req.user._id,
      status: "IN_PROGRESS",
    });

    if (!attempt) {
      return res.status(404).json({ success: false, message: "Active attempt not found or already submitted" });
    }

    // SERVER-SIDE DEADLINE VALIDATION (with 30s network buffer)
    if (Date.now() > attempt.deadline.getTime() + 30000) {
      attempt.status = "AUTO_SUBMITTED";
      await attempt.save();
      return res.status(400).json({ success: false, message: "Exam duration expired. Attempt auto-submitted." });
    }

    // Validate that questionId belongs to this attempt
    const orderedQ = attempt.orderedQuestions.find(
      (oq) => oq.question.toString() === questionId.toString()
    );
    if (!orderedQ) {
      return res.status(400).json({ success: false, message: "Question does not belong to this attempt" });
    }

    // Validate selectedClientIndex is in valid range
    if (
      selectedClientIndex !== null &&
      selectedClientIndex !== undefined &&
      (selectedClientIndex < 0 || selectedClientIndex >= orderedQ.shuffledOptions.length)
    ) {
      return res.status(400).json({ success: false, message: "Invalid option index" });
    }

    const existingAnswerIdx = attempt.answers.findIndex(
      (a) => a.questionId.toString() === questionId.toString()
    );

    if (existingAnswerIdx !== -1) {
      if (selectedClientIndex !== undefined) {
        attempt.answers[existingAnswerIdx].selectedOptionIndex = selectedClientIndex;
      }
      if (isMarkedForReview !== undefined) {
        attempt.answers[existingAnswerIdx].isMarkedForReview = isMarkedForReview;
      }
      if (timeSpentSeconds !== undefined) {
        attempt.answers[existingAnswerIdx].timeSpentSeconds = timeSpentSeconds;
      }
    } else {
      attempt.answers.push({
        questionId,
        selectedOptionIndex: selectedClientIndex !== undefined ? selectedClientIndex : null,
        isMarkedForReview: !!isMarkedForReview,
        timeSpentSeconds: timeSpentSeconds || 0,
      });
    }

    await attempt.save();
    return res.json({ success: true, message: "Answer saved" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Log anti-cheating violation (Tab switch, fullscreen exit)
// @route   POST /api/attempts/:attemptId/violation
// @access  Private
const logViolation = async (req, res) => {
  try {
    const { type, details } = req.body;
    const attempt = await Attempt.findOne({
      _id: req.params.attemptId,
      userId: req.user._id,
      status: "IN_PROGRESS",
    });

    if (!attempt) {
      return res.status(404).json({ success: false, message: "Attempt not found" });
    }

    attempt.violations.push({
      type: type || "TAB_SWITCH",
      details: details || "Window focus lost or tab switched",
      timestamp: new Date(),
    });
    attempt.violationCount = (attempt.violationCount || 0) + 1;

    let shouldAutoSubmit = false;
    if (attempt.violationCount >= 3) {
      shouldAutoSubmit = true;
      attempt.status = "AUTO_SUBMITTED";
    }

    await attempt.save();

    return res.json({
      success: true,
      violationCount: attempt.violationCount,
      shouldAutoSubmit,
      message: `Violation logged (${attempt.violationCount}/3)`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit attempt & evaluate scorecard
// @route   POST /api/attempts/:attemptId/submit
// @access  Private
const submitAttempt = async (req, res) => {
  try {
    const { clientAnswers } = req.body;

    const attempt = await Attempt.findOne({
      _id: req.params.attemptId,
      userId: req.user._id,
    }).populate("quizId");

    if (!attempt) {
      return res.status(404).json({ success: false, message: "Attempt not found" });
    }

    if (attempt.status === "SUBMITTED" || (attempt.status === "AUTO_SUBMITTED" && attempt.score > 0)) {
      return res.status(400).json({ success: false, message: "This attempt has already been evaluated" });
    }

    const quiz = attempt.quizId;
    const marksPerQ = quiz.marksPerQuestion || 2;
    const negativeMarks = quiz.negativeMarks || 0;

    // Calculate server-side elapsed time
    const now = new Date();
    const elapsedSeconds = Math.max(0, Math.round((now.getTime() - attempt.startTime.getTime()) / 1000));
    const maxAllowedSeconds = (quiz.durationMinutes || 15) * 60;
    const serverTimeTaken = Math.min(elapsedSeconds, maxAllowedSeconds);

    // Check if late submission
    const isLate = now.getTime() > attempt.deadline.getTime() + 30000;

    // Load full question documents with actual answers
    const questionIds = attempt.orderedQuestions.map((oq) => oq.question);
    const questions = await Question.find({ _id: { $in: questionIds } });
    const questionMap = new Map();
    questions.forEach((q) => questionMap.set(q._id.toString(), q));

    // Valid question IDs set for security
    const validQuestionIdSet = new Set(questionIds.map((id) => id.toString()));

    // Consolidate answers from clientAnswers payload (strictly validated)
    const finalAnswersMap = new Map();
    attempt.answers.forEach((ans) => {
      finalAnswersMap.set(ans.questionId.toString(), ans.selectedOptionIndex);
    });

    if (Array.isArray(clientAnswers)) {
      clientAnswers.forEach((ca) => {
        if (ca.questionId && validQuestionIdSet.has(ca.questionId.toString())) {
          finalAnswersMap.set(ca.questionId.toString(), ca.selectedOptionIndex);
        }
      });
    }

    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    let calculatedScore = 0;

    const evaluatedAnswers = [];

    attempt.orderedQuestions.forEach((oq) => {
      const qIdStr = oq.question.toString();
      const realQuestion = questionMap.get(qIdStr);
      const selectedClientIdx = finalAnswersMap.get(qIdStr);

      if (
        selectedClientIdx === null ||
        selectedClientIdx === undefined ||
        selectedClientIdx < 0 ||
        selectedClientIdx >= oq.shuffledOptions.length
      ) {
        skippedCount++;
        evaluatedAnswers.push({
          questionId: oq.question,
          selectedOptionIndex: null,
          isCorrect: false,
          marksAwarded: 0,
        });
      } else {
        // Resolve original option index from shuffled mapping
        const shuffledOpt = oq.shuffledOptions[selectedClientIdx];
        const originalIndex = shuffledOpt ? shuffledOpt.originalIndex : -1;

        const isCorrect =
          realQuestion &&
          realQuestion.options[originalIndex] &&
          realQuestion.options[originalIndex].isCorrect === true;

        if (isCorrect) {
          correctCount++;
          calculatedScore += marksPerQ;
          evaluatedAnswers.push({
            questionId: oq.question,
            selectedOptionIndex: selectedClientIdx,
            isCorrect: true,
            marksAwarded: marksPerQ,
          });
        } else {
          wrongCount++;
          calculatedScore -= negativeMarks;
          evaluatedAnswers.push({
            questionId: oq.question,
            selectedOptionIndex: selectedClientIdx,
            isCorrect: false,
            marksAwarded: -negativeMarks,
          });
        }
      }
    });

    const maxScore = attempt.orderedQuestions.length * marksPerQ;
    const finalScore = Math.max(0, calculatedScore);
    const percentage = maxScore > 0 ? Math.round((finalScore / maxScore) * 100) : 0;
    const passed = percentage >= (quiz.passingPercentage || 40);

    attempt.answers = evaluatedAnswers;
    attempt.score = finalScore;
    attempt.maxScore = maxScore;
    attempt.percentage = percentage;
    attempt.passed = passed;
    attempt.correctCount = correctCount;
    attempt.wrongCount = wrongCount;
    attempt.skippedCount = skippedCount;
    attempt.timeTakenSeconds = serverTimeTaken;
    attempt.endTime = now;
    attempt.status = isLate || attempt.violationCount >= 3 ? "AUTO_SUBMITTED" : "SUBMITTED";

    await attempt.save();

    // Update User Stats
    const user = await User.findById(req.user._id);
    if (user) {
      const prevTotal = user.stats.quizzesAttempted || 0;
      const prevAvg = user.stats.averageScore || 0;
      user.stats.quizzesAttempted = prevTotal + 1;
      user.stats.averageScore = Math.round((prevAvg * prevTotal + percentage) / (prevTotal + 1));
      user.stats.totalPoints = (user.stats.totalPoints || 0) + finalScore;
      await user.save();
    }

    // Auto-generate certificate if passed AND user is student!
    let certificate = null;
    if (passed && user.role === "student") {
      certificate = await Certificate.create({
        certificateId: generateCertificateId(),
        user: user._id,
        quiz: quiz._id,
        attempt: attempt._id,
        recipientName: user.name,
        quizTitle: quiz.title,
        subject: quiz.subject,
        score: finalScore,
        percentage,
      });
    }

    // Dispatch Quiz Scorecard Email asynchronously (non-blocking)
    if (user && user.email) {
      sendQuizResultEmail({
        to: user.email,
        name: user.name,
        quizTitle: quiz.title,
        subject: quiz.subject,
        score: finalScore,
        maxScore,
        percentage,
        passed,
        correctCount,
        wrongCount,
        skippedCount,
        timeTakenSeconds: attempt.timeTakenSeconds,
        attemptId: attempt._id,
      }).catch((err) => console.error("Quiz result email error:", err.message));

      // Dispatch Certificate Notification Email if student qualified
      if (passed && certificate) {
        sendCertificateEmail({
          to: user.email,
          name: user.name,
          quizTitle: quiz.title,
          certificateId: certificate.certificateId,
          percentage,
          issueDate: certificate.createdAt,
        }).catch((err) => console.error("Certificate email error:", err.message));
      }
    }

    return res.json({
      success: true,
      message: "Quiz submitted and evaluated successfully!",
      data: {
        attemptId: attempt._id,
        score: finalScore,
        maxScore,
        percentage,
        passed,
        correctCount,
        wrongCount,
        skippedCount,
        timeTakenSeconds: attempt.timeTakenSeconds,
        certificateId: certificate ? certificate.certificateId : null,
      },
    });
  } catch (error) {
    console.error("Submit Attempt Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed result breakdown for attempt
// @route   GET /api/attempts/:attemptId/result
// @access  Private
const getAttemptResult = async (req, res) => {
  try {
    const attempt = await Attempt.findOne({
      _id: req.params.attemptId,
      userId: req.user._id,
    })
      .populate("quizId")
      .populate("orderedQuestions.question");

    if (!attempt) {
      return res.status(404).json({ success: false, message: "Attempt not found" });
    }

    // Build question-by-question review with explanations
    const reviewData = attempt.orderedQuestions.map((oq, index) => {
      const q = oq.question;
      const ansRecord = attempt.answers.find(
        (a) => a.questionId.toString() === q._id.toString()
      );

      const selectedClientIdx = ansRecord ? ansRecord.selectedOptionIndex : null;
      let selectedText = "Not Answered";
      if (selectedClientIdx !== null && selectedClientIdx !== undefined && oq.shuffledOptions[selectedClientIdx]) {
        selectedText = oq.shuffledOptions[selectedClientIdx].text;
      }

      const correctOpt = q.options.find((opt) => opt.isCorrect);

      return {
        questionNumber: index + 1,
        questionText: q.questionText,
        subject: q.subject,
        topic: q.topic,
        selectedOption: selectedText,
        correctOption: correctOpt ? correctOpt.text : "N/A",
        isCorrect: ansRecord ? ansRecord.isCorrect : false,
        marksAwarded: ansRecord ? ansRecord.marksAwarded : 0,
        explanation: q.explanation || "No explanation provided.",
      };
    });

    const cert = await Certificate.findOne({ attempt: attempt._id });

    return res.json({
      success: true,
      data: {
        attempt: {
          _id: attempt._id,
          quizTitle: attempt.quizId.title,
          subject: attempt.quizId.subject,
          score: attempt.score,
          maxScore: attempt.maxScore,
          percentage: attempt.percentage,
          passed: attempt.passed,
          correctCount: attempt.correctCount,
          wrongCount: attempt.wrongCount,
          skippedCount: attempt.skippedCount,
          timeTakenSeconds: attempt.timeTakenSeconds,
          status: attempt.status,
          violations: attempt.violations,
          certificateId: cert ? cert.certificateId : null,
        },
        reviews: reviewData,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all user's previous attempts (Attempts History)
// @route   GET /api/attempts/my-attempts
// @access  Private
const getMyAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.find({
      userId: req.user._id,
      status: { $in: ["SUBMITTED", "AUTO_SUBMITTED"] },
    })
      .populate("quizId", "title subject totalQuestions durationMinutes")
      .sort({ createdAt: -1 });

    const formatted = attempts.map((a) => ({
      _id: a._id,
      quizTitle: a.quizId?.title || "Quiz Examination",
      subject: a.quizId?.subject || "General",
      score: a.score,
      maxScore: a.maxScore,
      percentage: a.percentage,
      passed: a.passed,
      timeTakenSeconds: a.timeTakenSeconds,
      createdAt: a.createdAt,
    }));

    return res.json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get active in-progress exam attempt if any
// @route   GET /api/attempts/active
// @access  Private
const getActiveAttempt = async (req, res) => {
  try {
    const active = await Attempt.findOne({
      userId: req.user._id,
      status: "IN_PROGRESS",
      deadline: { $gt: new Date() },
    }).populate("quizId", "title subject durationMinutes totalQuestions");

    if (!active) {
      return res.json({ success: true, hasActive: false, data: null });
    }

    const remainingSeconds = Math.max(
      0,
      Math.round((active.deadline.getTime() - Date.now()) / 1000)
    );

    const answeredCount = (active.answers || []).filter(
      (a) => a.selectedOptionIndex !== null && a.selectedOptionIndex !== undefined
    ).length;

    return res.json({
      success: true,
      hasActive: true,
      data: {
        attemptId: active._id,
        quizId: active.quizId?._id,
        quizTitle: active.quizId?.title || "Active Examination",
        subject: active.quizId?.subject || "Technical Examination",
        remainingSeconds,
        deadline: active.deadline,
        answeredCount,
        totalQuestions: active.orderedQuestions.length,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  startAttempt,
  saveAnswer,
  logViolation,
  submitAttempt,
  getAttemptResult,
  getMyAttempts,
  getActiveAttempt,
};
