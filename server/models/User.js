const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: "" },
    image: { type: String, default: "" },
    fullName: { type: String, default: "" },
    branch: {
      type: String,
      enum: [
        "computer science and engineering",
        "mechanical engineering",
        "civil engineering",
        "electrical engineering",
        "electronics and communication engineering",
      ],
      default: "",
    },
    yearOfStudy: { type: Number, min: 1, max: 8, default: null },
    studentId: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
    profileCompleted: { type: Boolean, default: false, index: true },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },
    isBanned: { type: Boolean, default: false, index: true },
    disqualifiedQuizIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Quiz" }],
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, isBanned: 1 });

module.exports = mongoose.models.User || mongoose.model("User", userSchema);