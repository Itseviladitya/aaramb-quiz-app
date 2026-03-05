const mongoose = require("mongoose");
const fs = require("fs");
const Question = require("./server/models/Question");

async function run() {
    const envFile = fs.readFileSync(".env.local", "utf8");
    const uriMatch = envFile.match(/MONGODB_URI=(.*)/);
    const uri = uriMatch ? uriMatch[1] : "mongodb://localhost:27017/quiz";

    await mongoose.connect(uri.trim());

    const result = await Question.updateMany(
        { timeLimitSecOverride: { $ne: null } },
        { $set: { timeLimitSecOverride: null } }
    );

    console.log(`Updated ${result.modifiedCount} questions to remove time overrides.`);

    process.exit(0);
}

run().catch(console.error);
