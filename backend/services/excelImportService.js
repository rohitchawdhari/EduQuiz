const xlsx = require("xlsx");

const parseQuestionFile = (fileBuffer) => {
  const workbook = xlsx.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet);

  if (!rows || rows.length === 0) {
    throw new Error("Uploaded file is empty or has no readable rows.");
  }

  const parsedQuestions = [];
  const errors = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2; // Accounting for 1-based index + header row

    // Extract fields with multiple possible case headers
    const questionText = row["Question"] || row["question"] || row["Question Text"] || row["QUESTION"];
    const optA = row["Option A"] || row["OptionA"] || row["A"] || row["option_a"];
    const optB = row["Option B"] || row["OptionB"] || row["B"] || row["option_b"];
    const optC = row["Option C"] || row["OptionC"] || row["C"] || row["option_c"];
    const optD = row["Option D"] || row["OptionD"] || row["D"] || row["option_d"];
    const rawAnswer = String(row["Answer"] || row["Correct Answer"] || row["answer"] || "").trim();
    const difficultyRaw = String(row["Difficulty"] || row["difficulty"] || "Medium").trim();
    const marks = Number(row["Marks"] || row["marks"]) || 1;
    const explanation = row["Explanation"] || row["explanation"] || "";
    const topic = row["Topic"] || row["topic"] || "General";

    if (!questionText || !optA || !optB) {
      errors.push(`Row ${rowNum}: Missing question text or minimum 2 options.`);
      return;
    }

    const options = [
      { text: String(optA).trim(), isCorrect: false },
      { text: String(optB).trim(), isCorrect: false },
    ];
    if (optC) options.push({ text: String(optC).trim(), isCorrect: false });
    if (optD) options.push({ text: String(optD).trim(), isCorrect: false });

    // Determine correct option
    const answerUpper = rawAnswer.toUpperCase();
    if (answerUpper === "A" || answerUpper === "1") options[0].isCorrect = true;
    else if (answerUpper === "B" || answerUpper === "2") options[1].isCorrect = true;
    else if ((answerUpper === "C" || answerUpper === "3") && options[2]) options[2].isCorrect = true;
    else if ((answerUpper === "D" || answerUpper === "4") && options[3]) options[3].isCorrect = true;
    else {
      // Direct string matching
      const foundIdx = options.findIndex((o) => o.text.toLowerCase() === rawAnswer.toLowerCase());
      if (foundIdx !== -1) {
        options[foundIdx].isCorrect = true;
      } else {
        errors.push(`Row ${rowNum}: Invalid or missing answer "${rawAnswer}". Must be A, B, C, D or match option text.`);
        return;
      }
    }

    // Normalize difficulty
    let difficulty = "Medium";
    if (/easy/i.test(difficultyRaw)) difficulty = "Easy";
    else if (/hard/i.test(difficultyRaw)) difficulty = "Hard";

    parsedQuestions.push({
      questionText: String(questionText).trim(),
      options,
      difficulty,
      marks,
      explanation: String(explanation).trim(),
      topic: String(topic).trim(),
      questionType: "MCQ",
    });
  });

  return {
    questions: parsedQuestions,
    errors,
    totalParsed: parsedQuestions.length,
  };
};

module.exports = {
  parseQuestionFile,
};
