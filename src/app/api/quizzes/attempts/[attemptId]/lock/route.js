import { requireAdminUser, apiErrorResponse } from "@/lib/apiAuth";
import quizServiceModule from "../../../../../../../server/services/quizService";

const quizService = quizServiceModule.default || quizServiceModule;

export async function POST(request, { params }) {
    try {
        const { attemptId } = await params;
        // We let normal users lock their own attempt (when they click exit)
        // Actually wait, this is for the user to lock their own attempt when they click "Exit".
        // So this should be requireUser, not requireAdminUser 
        const { requireUser } = await import("@/lib/apiAuth");
        const user = await requireUser();

        await quizService.lockAttempt({ userId: user._id, attemptId });
        return Response.json({ ok: true });
    } catch (error) {
        return apiErrorResponse(error);
    }
}
