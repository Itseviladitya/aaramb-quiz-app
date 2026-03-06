import { requireUser, apiErrorResponse } from "@/lib/apiAuth";
import adminServiceModule from "../../../../../../../server/services/adminService";

const adminService = adminServiceModule.default || adminServiceModule;

export async function POST(request, { params }) {
  try {
    const user = await requireUser();
    const { attemptId } = await params;
    const body = await request.json();

    const created = await adminService.createResubmitRequest({
      attemptId,
      userId: user._id,
      reason: body?.reason,
    });

    return Response.json({ request: created }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
