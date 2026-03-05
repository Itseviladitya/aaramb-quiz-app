const mongoose = require("mongoose");
const fs = require("fs");
const Quiz = require("./server/models/Quiz");
const Question = require("./server/models/Question");

async function run() {
    const envFile = fs.readFileSync(".env.local", "utf8");
    const uriMatch = envFile.match(/MONGODB_URI=(.*)/);
    const uri = uriMatch ? uriMatch[1] : "mongodb://localhost:27017/quiz";

    await mongoose.connect(uri.trim());

    const quizzes = await Quiz.find().sort({ createdAt: -1 }).limit(2).lean();
    console.log("Recent quizzes:", JSON.stringify(quizzes, null, 2));

    for (const q of quizzes) {
        const questions = await Question.find({ quizId: q._id }).lean();
        console.log(`Questions for quiz ${q.title}:`, JSON.stringify(questions, null, 2));
    }

    process.exit(0);
}

run().catch(console.error);
