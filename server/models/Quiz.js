const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    questionsPerAttempt: { type: Number, default: 20, min: 1 },
    totalQuestionPool: { type: Number, default: 0 },
    proctoringLimit: { type: Number, default: 3, min: 1 },
    timerMode: {
      type: String,
      enum: ["quiz", "question", "mixed"],
      default: "quiz",
    },
    startsAt: { type: Date, default: null, index: true },
    endsAt: { type: Date, default: null, index: true },
    quizTimeLimitSec: { type: Number, default: 600, min: 10 },
    perQuestionTimeLimitSec: { type: Number, default: 30, min: 5 },
    allowRetry: { type: Boolean, default: false },
  },
  { timestamps: true }
);

quizSchema.index({ status: 1, createdAt: -1 });
quizSchema.index({ status: 1, startsAt: 1, endsAt: 1 });

module.exports = mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);