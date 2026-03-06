const mongoose = require("mongoose");

const resubmitRequestSchema = new mongoose.Schema(
  {
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
      required: true,
      index: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reason: { type: String, required: true, trim: true, minlength: 5, maxlength: 1000 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewAction: {
      type: String,
      enum: ["reset"],
      default: "reset",
    },
    reviewNote: { type: String, default: "", trim: true, maxlength: 1000 },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

resubmitRequestSchema.index({ status: 1, createdAt: -1 });
resubmitRequestSchema.index({ quizId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.models.ResubmitRequest || mongoose.model("ResubmitRequest", resubmitRequestSchema);
