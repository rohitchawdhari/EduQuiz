/**
 * EduQuiz - Comprehensive Subject & Quiz Seeder
 * Populates MongoDB with verified technical & aptitude question banks
 * across Easy, Medium, and Hard difficulties, and generates published,
 * ready-to-attempt quizzes for immediate practice in every difficulty tier.
 */

const Question = require("../models/Question");
const Quiz = require("../models/Quiz");
const User = require("../models/User");

const cseSubjectsQuestions = require("./seedData/cseSubjectsData");
const cseProgrammingQuestions = require("./seedData/cseProgrammingData");
const cseSpecializedQuestions = require("./seedData/cseSpecializedData");
const aptitudeQuestions = require("./seedData/aptitudeData");
const hardQuestionsPool = require("./seedData/hardQuestionsData");

// Merge question banks
const allQuestionBanks = {};

// Helper to merge into allQuestionBanks
function mergeQuestions(source) {
  for (const [subject, qList] of Object.entries(source)) {
    if (!allQuestionBanks[subject]) {
      allQuestionBanks[subject] = [];
    }
    allQuestionBanks[subject].push(...qList);
  }
}

mergeQuestions(cseSubjectsQuestions);
mergeQuestions(cseProgrammingQuestions);
mergeQuestions(cseSpecializedQuestions);
mergeQuestions(aptitudeQuestions);
mergeQuestions(hardQuestionsPool);

const seedComprehensiveQuizzes = async () => {
  try {
    console.log("🌱 Verifying comprehensive syllabus questions & multi-difficulty quizzes in MongoDB...");

    // Find admin user or fallback
    let admin = await User.findOne({ role: "admin" });
    if (!admin) {
      admin = await User.findOne();
    }
    const adminId = admin ? admin._id : null;

    let totalInsertedQuestions = 0;
    let totalUpdatedQuizzes = 0;

    // 1. Seed / Upsert Questions into MongoDB
    for (const [subjectName, questions] of Object.entries(allQuestionBanks)) {
      for (const q of questions) {
        let questionDoc = await Question.findOne({
          questionText: q.questionText,
          subject: subjectName,
        });

        if (!questionDoc) {
          questionDoc = await Question.create({
            questionText: q.questionText,
            options: q.options,
            subject: subjectName,
            topic: q.topic || "Core",
            difficulty: q.difficulty || "Medium",
            marks: q.marks || 2,
            negativeMarks: q.negativeMarks || 0.5,
            explanation: q.explanation || "",
            source: "BANK",
            createdBy: adminId,
          });
          totalInsertedQuestions++;
        }
      }

      // Fetch all questions for this subject
      const allSubjectQuestions = await Question.find({ subject: subjectName });
      const easyQuestions = allSubjectQuestions.filter((q) => q.difficulty === "Easy");
      const mediumQuestions = allSubjectQuestions.filter((q) => q.difficulty === "Medium");
      const hardQuestions = allSubjectQuestions.filter((q) => q.difficulty === "Hard");

      // 2. Create Published Ready Quizzes for every difficulty tier: Easy, Medium, Hard, Mixed
      const quizConfigs = [
        {
          tier: "Easy",
          title: `${subjectName} Fundamentals (Easy)`,
          description: `Entry-level practice testing foundational principles, syntax, and essential definitions in ${subjectName}.`,
          duration: 15,
          pool: easyQuestions.length >= 10 ? easyQuestions : allSubjectQuestions,
        },
        {
          tier: "Medium",
          title: `${subjectName} Intermediate Assessment (Medium)`,
          description: `Mid-level evaluation assessing standard algorithmic logic, scenarios, and problem solving in ${subjectName}.`,
          duration: 20,
          pool: mediumQuestions.length >= 10 ? mediumQuestions : allSubjectQuestions,
        },
        {
          tier: "Hard",
          title: `${subjectName} Advanced Diagnostic Drill (Hard)`,
          description: `Challenging exam covering internal architecture, edge cases, deep analysis, and optimization in ${subjectName}.`,
          duration: 25,
          pool: hardQuestions.length >= 5 ? hardQuestions : allSubjectQuestions,
        },
        {
          tier: "Mixed",
          title: `${subjectName} Comprehensive Mastery Exam (Mixed)`,
          description: `Full syllabus multi-level examination balanced with Easy, Medium, and Hard placement-grade problems in ${subjectName}.`,
          duration: 20,
          pool: allSubjectQuestions,
        },
      ];

      for (const config of quizConfigs) {
        let existing = await Quiz.findOne({
          subject: subjectName,
          difficulty: config.tier,
          isPublic: true,
        });

        const qIds = config.pool.map((q) => q._id);
        const selectedIds = qIds.slice(0, Math.min(20, qIds.length));

        if (!existing) {
          await Quiz.create({
            title: config.title,
            description: config.description,
            subject: subjectName,
            topic: "All Topics",
            difficulty: config.tier,
            difficultyDistribution:
              config.tier === "Mixed"
                ? { easy: 8, medium: 8, hard: 4 }
                : { [config.tier.toLowerCase()]: selectedIds.length },
            questionType: "ALL",
            totalQuestions: selectedIds.length,
            durationMinutes: config.duration,
            marksPerQuestion: 2,
            negativeMarks: 0.5,
            shuffleQuestions: true,
            shuffleOptions: true,
            passingPercentage: 40,
            questions: selectedIds,
            createdBy: adminId,
            isPublic: true,
            sourceType: "BANK",
          });
          totalUpdatedQuizzes++;
        } else {
          // Update question pool if new questions available
          if (existing.questions.length < selectedIds.length) {
            existing.questions = selectedIds;
            existing.totalQuestions = selectedIds.length;
            await existing.save();
          }
        }
      }
    }

    console.log(
      `✅ Seeding Complete! Inserted new questions: ${totalInsertedQuestions}, Created/Updated ready quizzes: ${totalUpdatedQuizzes}`
    );
  } catch (err) {
    console.error("❌ Comprehensive Quiz Seeding error:", err.message);
  }
};

module.exports = seedComprehensiveQuizzes;
