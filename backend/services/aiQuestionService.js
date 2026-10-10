/**
 * AI Question Generator Service
 * Utilizes Google Gemini API (if GEMINI_API_KEY is configured in .env)
 * Generates verified JSON MCQ questions for any technical or aptitude subject
 */

const Question = require("../models/Question");

const generateQuestionsWithAI = async ({
  subject,
  topic = "General",
  difficulty = "Medium",
  count = 5,
}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      message: "GEMINI_API_KEY is not configured in .env",
      questions: [],
    };
  }

  const prompt = `You are a university computer science and competitive assessment examination professor.
Generate exactly ${count} multiple choice questions (MCQ) for the subject "${subject}" (Topic: "${topic}", Difficulty: "${difficulty}").

Requirements:
1. Return ONLY a valid JSON array of objects, with no markdown formatting or commentary.
2. Each object must have this exact structure:
{
  "questionText": "string",
  "difficulty": "${difficulty}",
  "marks": 2,
  "negativeMarks": 0.5,
  "explanation": "concise explanation of why the correct answer is right",
  "topic": "${topic}",
  "options": [
    { "text": "string", "isCorrect": false },
    { "text": "string", "isCorrect": true },
    { "text": "string", "isCorrect": false },
    { "text": "string", "isCorrect": false }
  ]
}
3. Each question must have exactly 4 options.
4. Exactly one option must have "isCorrect": true.
5. Difficulty must strictly be "${difficulty}".`;

  // Candidate Gemini model endpoints in priority order
  const candidateModels = [
    "gemini-2.5-flash",
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
  ];

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        // Try next candidate model
        continue;
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      // Clean & parse JSON
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed)) continue;

      // Validate & deduplicate
      const validatedQuestions = [];
      const mongoose = require("mongoose");
      for (const q of parsed) {
        if (
          q.questionText &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          q.options.filter((o) => o.isCorrect === true).length === 1
        ) {
          let isDuplicate = false;
          if (mongoose.connection && mongoose.connection.readyState === 1) {
            isDuplicate = await Question.exists({ questionText: q.questionText });
          }
          if (!isDuplicate) {
            validatedQuestions.push({
              questionText: q.questionText,
              options: q.options,
              difficulty: q.difficulty || difficulty,
              marks: q.marks || 2,
              negativeMarks: q.negativeMarks || 0.5,
              explanation: q.explanation || "",
              topic: q.topic || topic,
              subject,
              source: "ONLINE",
            });
          }
        }
      }

      if (validatedQuestions.length > 0) {
        return {
          success: true,
          totalGenerated: validatedQuestions.length,
          questions: validatedQuestions,
          modelUsed: model,
        };
      }
    } catch (err) {
      // Continue to next model or gracefully return
    }
  }

  return {
    success: false,
    message: "AI question generation unavailable or yielded zero unique questions.",
    questions: [],
  };
};

module.exports = {
  generateQuestionsWithAI,
};
