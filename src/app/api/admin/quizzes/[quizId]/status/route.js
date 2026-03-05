import { requireAdminOrManagerUser, apiErrorResponse } from "@/lib/apiAuth";
import adminServiceModule from "../../../../../../../server/services/adminService";

const adminService = adminServiceModule.default || adminServiceModule;

export async function PATCH(request, { params }) {
  try {
    const { quizId } = await params;
    await requireAdminOrManagerUser();
    const body = await request.json();
    const quiz = await adminService.setQuizStatus(quizId, body.status);
    return Response.json({ quiz });
  } catch (error) {
    return apiErrorResponse(error);
  }
}