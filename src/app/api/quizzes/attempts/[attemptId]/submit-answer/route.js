import { requireUser, apiErrorResponse } from "@/lib/apiAuth";
import { deleteByPrefix, rateLimit } from "@/lib/redis";
import quizServiceModule from "../../../../../../../server/services/quizService";

const quizService = quizServiceModule.default || quizServiceModule;
const SUBMIT_RATE_LIMIT = Number(process.env.QUIZ_SUBMIT_RATE_LIMIT || 8);
const SUBMIT_RATE_WINDOW_SECONDS = Number(process.env.QUIZ_SUBMIT_RATE_WINDOW_SECONDS || 10);

export async function POST(request, { params }) {
  try {
    const { attemptId } = await params;
    const user = await requireUser();

    const limiter = await rateLimit({
      key: `submit:${user._id.toString()}:${attemptId}`,
      limit: SUBMIT_RATE_LIMIT,
      windowSeconds: SUBMIT_RATE_WINDOW_SECONDS,
    });

    if (!limiter.allowed) {
      return Response.json(
        {
          message: "Too many submissions in a short time. Please wait a moment and retry.",
          retryAfterSeconds: limiter.resetInSeconds,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = await quizService.submitAnswer({
      userId: user._id,
      attemptId,
      questionId: body.questionId,
      selectedOptionKey: body.selectedOptionKey,
      clientSentAt: body.clientSentAt,
    });

    if (result.finished) {
      await deleteByPrefix("leaderboard:");
    }

    return Response.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}