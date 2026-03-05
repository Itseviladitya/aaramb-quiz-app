import { requireUser, apiErrorResponse } from "@/lib/apiAuth";
import Attempt from "../../../../../server/models/Attempt";

export async function GET() {
  try {
    const user = await requireUser();
    const attempts = await Attempt.find({ userId: user._id, status: { $in: ["submitted", "disqualified", "expired"] } })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("quizId", "title")
      .lean();

    return Response.json({ attempts });
  } catch (error) {
    return apiErrorResponse(error);
  }
}