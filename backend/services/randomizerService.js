/**
 * Fisher-Yates array shuffler
 */
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Balance questions based on difficulty distribution or general count
 * @param {Array} availableQuestions - Pool of questions from DB or Online
 * @param {Object} config - { count, difficulty, distribution: { easy, medium, hard } }
 */
const selectRandomQuestions = (availableQuestions, config) => {
  const { count = 10, difficulty = "Mixed", distribution = {} } = config;

  if (!availableQuestions || availableQuestions.length === 0) {
    return {
      success: false,
      message: "No questions available for this subject or filter.",
      questions: [],
    };
  }

  // If specific difficulty requested
  if (difficulty !== "Mixed") {
    const filtered = availableQuestions.filter(
      (q) => q.difficulty.toLowerCase() === difficulty.toLowerCase()
    );

    if (filtered.length < count) {
      return {
        success: false,
        warning: `Only ${filtered.length} ${difficulty} questions are available (Requested: ${count}).`,
        availableCount: filtered.length,
        requestedCount: count,
        questions: shuffleArray(filtered),
      };
    }

    return {
      success: true,
      questions: shuffleArray(filtered).slice(0, count),
    };
  }

  // If specific breakdown requested (e.g. 10 easy, 7 medium, 3 hard)
  if (
    distribution.easy !== undefined &&
    distribution.medium !== undefined &&
    distribution.hard !== undefined &&
    distribution.easy + distribution.medium + distribution.hard > 0
  ) {
    const easyPool = availableQuestions.filter((q) => q.difficulty === "Easy");
    const medPool = availableQuestions.filter((q) => q.difficulty === "Medium");
    const hardPool = availableQuestions.filter((q) => q.difficulty === "Hard");

    const shortages = [];
    if (easyPool.length < distribution.easy) {
      shortages.push(`Easy (${easyPool.length} available, ${distribution.easy} requested)`);
    }
    if (medPool.length < distribution.medium) {
      shortages.push(`Medium (${medPool.length} available, ${distribution.medium} requested)`);
    }
    if (hardPool.length < distribution.hard) {
      shortages.push(`Hard (${hardPool.length} available, ${distribution.hard} requested)`);
    }

    if (shortages.length > 0) {
      return {
        success: false,
        message: `Insufficient questions for exact distribution: ${shortages.join(", ")}. Please adjust counts or add more questions.`,
        questions: [],
      };
    }

    const selected = [
      ...shuffleArray(easyPool).slice(0, distribution.easy),
      ...shuffleArray(medPool).slice(0, distribution.medium),
      ...shuffleArray(hardPool).slice(0, distribution.hard),
    ];

    return {
      success: true,
      questions: shuffleArray(selected),
    };
  }

  // Default: Mixed shuffle
  const shuffled = shuffleArray(availableQuestions);
  return {
    success: true,
    questions: shuffled.slice(0, Math.min(count, shuffled.length)),
  };
};

module.exports = {
  shuffleArray,
  selectRandomQuestions,
};
