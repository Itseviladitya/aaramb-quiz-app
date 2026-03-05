import { requireAdminUser, apiErrorResponse } from "@/lib/apiAuth";
import Attempt from "../../../../../../../server/models/Attempt";

export async function DELETE(_request, { params }) {
    try {
        await requireAdminUser();
        const { attemptId } = await params;

        const attempt = await Attempt.findByIdAndDelete(attemptId);
        if (!attempt) {
            return Response.json({ message: "Attempt not found" }, { status: 404 });
        }

        return Response.json({ ok: true });
    } catch (error) {
        return apiErrorResponse(error);
    }
}
