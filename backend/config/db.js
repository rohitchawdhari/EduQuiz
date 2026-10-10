const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    let mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/eduquiz";

    // Auto-fix unintentional angle brackets in Atlas connection strings if user left <password>
    if (mongoURI.includes("<") && mongoURI.includes(">")) {
      mongoURI = mongoURI.replace(/<([^>]+)>/g, "$1");
    }

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("✅ MongoDB Atlas Connected Successfully!");
    const seedQuestionsIfEmpty = require("./seedQuestions");
    await seedQuestionsIfEmpty();
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    if (error.message.includes("SSL") || error.message.includes("tlsv1 alert")) {
      console.warn(
        "\n⚠️ [Atlas Notice]: Your IP address might not be whitelisted in MongoDB Atlas.\n" +
        "👉 Go to MongoDB Atlas -> Network Access -> Add IP Address -> Select 'Allow Access from Anywhere (0.0.0.0/0)'.\n" +
        "👉 Also check that your username & password in .env are correct.\n"
      );
    }
  }
};

module.exports = connectDB;