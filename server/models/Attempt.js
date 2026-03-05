const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    selectedOptionKey: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    pointsAwarded: { type: Number, required: true },
    answeredAt: { type: Date, required: true },
    responseTimeMs: { type: Number, required: true },
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["in_progress", "submitted", "expired", "disqualified"],
      default: "in_progress",
      index: true,
    },
    assignedQuestionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true }],
    currentQuestionIndex: { type: Number, default: 0 },
    startedAt: { type: Date, required: true, index: true },
    submittedAt: { type: Date, default: null },
    questionServedAt: {
      type: Map,
      of: Date,
      default: {},
    },
    answers: { type: [answerSchema], default: [] },
    totalScore: { type: Number, default: 0 },
    warnings: { type: Number, default: 0 },
    disqualifyReason: { type: String, default: "" },
    isLocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

attemptSchema.index({ userId: 1, quizId: 1, createdAt: -1 });
attemptSchema.index({ quizId: 1, totalScore: -1, submittedAt: 1 });

module.exports = mongoose.models.Attempt || mongoose.model("Attempt", attemptSchema);