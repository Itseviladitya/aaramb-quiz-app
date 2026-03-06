import { requireAdminOrManagerUser, apiErrorResponse } from "@/lib/apiAuth";
import adminServiceModule from "../../../../../../server/services/adminService";

const adminService = adminServiceModule.default || adminServiceModule;

export async function PATCH(request, { params }) {
  try {
    const actor = await requireAdminOrManagerUser();
    const { requestId } = await params;
    const body = await request.json();

    const updated = await adminService.reviewResubmitRequest({
      requestId,
      actorUserId: actor._id,
      actorRole: actor.role,
      decision: body?.decision,
      reviewNote: body?.reviewNote,
    });

    return Response.json({ request: updated });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
