require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('./models/Question');
const Quiz = require('./models/Quiz');

async function check() {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
      break;
    } catch (e) {
      if (attempt === 5) throw e;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  const questions = await Question.find().select('difficulty subject');
  const qByDiff = {};
  const qBySubjectAndDiff = {};
  questions.forEach((q) => {
    const d = q.difficulty || 'Unspecified';
    qByDiff[d] = (qByDiff[d] || 0) + 1;

    const s = q.subject || 'Unknown';
    if (!qBySubjectAndDiff[s]) qBySubjectAndDiff[s] = {};
    qBySubjectAndDiff[s][d] = (qBySubjectAndDiff[s][d] || 0) + 1;
  });

  console.log('Total Questions by Difficulty:');
  console.log(qByDiff);

  console.log('\nSubject x Difficulty Breakdown:');
  console.log(JSON.stringify(qBySubjectAndDiff, null, 2));

  const quizzes = await Quiz.find().select('title subject difficulty');
  console.log('\nQuizzes in DB:');
  quizzes.forEach((qz) => {
    console.log(`- ${qz.title} [${qz.subject}]: Difficulty = ${qz.difficulty}`);
  });

  process.exit(0);
}
check().catch((e) => {
  console.error(e);
  process.exit(1);
});
