import { requireAdminUser, apiErrorResponse } from "@/lib/apiAuth";
import Attempt from "../../../../../../../server/models/Attempt";

export async function PATCH(_request, { params }) {
    try {
        await requireAdminUser();
        const { attemptId } = await params;

        const attempt = await Attempt.findById(attemptId);
        if (!attempt) {
            return Response.json({ message: "Attempt not found" }, { status: 404 });
        }

        attempt.status = "in_progress";
        attempt.isLocked = false;
        attempt.warnings = 0;
        attempt.disqualifyReason = "";
        await attempt.save();

        return Response.json({ ok: true });
    } catch (error) {
        return apiErrorResponse(error);
    }
}
