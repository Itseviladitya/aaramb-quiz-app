const Attempt = require("../models/Attempt");

async function getLeaderboardForUser() {
  return Attempt.aggregate([
    { $match: { status: "submitted" } },
    {
      $addFields: {
        correctAnswers: {
          $size: {
            $filter: {
              input: { $ifNull: ["$answers", []] },
              as: "answer",
              cond: { $eq: ["$$answer.isCorrect", true] },
            },
          },
        },
      },
    },
    { $sort: { correctAnswers: -1, totalScore: -1, submittedAt: 1, createdAt: 1 } },
    { $limit: 50 },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userId",
        pipeline: [{ $project: { name: 1, email: 1 } }],
      },
    },
    {
      $lookup: {
        from: "quizzes",
        localField: "quizId",
        foreignField: "_id",
        as: "quizId",
        pipeline: [{ $project: { title: 1 } }],
      },
    },
    {
      $addFields: {
        userId: { $first: "$userId" },
        quizId: { $first: "$quizId" },
      },
    },
    {
      $project: {
        answers: 0,
        logs: 0,
        questionServedAt: 0,
      },
    },
  ]);
}

async function hasParticipated(userId) {
  const count = await Attempt.countDocuments({ userId, status: { $in: ["submitted", "in_progress"] } });
  return count > 0;
}

module.exports = {
  getLeaderboardForUser,
  hasParticipated,
};