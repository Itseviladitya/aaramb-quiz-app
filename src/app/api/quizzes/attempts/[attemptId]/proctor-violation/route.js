import { requireUser, apiErrorResponse } from "@/lib/apiAuth";
import { rateLimit } from "@/lib/redis";
import quizServiceModule from "../../../../../../../server/services/quizService";

const quizService = quizServiceModule.default || quizServiceModule;
const PROCTOR_RATE_LIMIT = Number(process.env.QUIZ_PROCTOR_RATE_LIMIT || 20);
const PROCTOR_RATE_WINDOW_SECONDS = Number(process.env.QUIZ_PROCTOR_RATE_WINDOW_SECONDS || 10);

export async function POST(request, { params }) {
  try {
    const { attemptId } = await params;
    const user = await requireUser();

    const limiter = await rateLimit({
      key: `proctor:${user._id.toString()}:${attemptId}`,
      limit: PROCTOR_RATE_LIMIT,
      windowSeconds: PROCTOR_RATE_WINDOW_SECONDS,
    });

    if (!limiter.allowed) {
      return Response.json(
        {
          message: "Too many proctoring events in a short time. Please wait and retry.",
          retryAfterSeconds: limiter.resetInSeconds,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    await quizService.reportProctorViolation({
      userId: user._id,
      attemptId,
      reason: body.reason,
    });
    return Response.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}