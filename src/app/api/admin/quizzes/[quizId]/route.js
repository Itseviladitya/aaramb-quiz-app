import { requireAdminOrManagerUser, requireAdminUser, apiErrorResponse } from "@/lib/apiAuth";
import adminServiceModule from "../../../../../../server/services/adminService";

const adminService = adminServiceModule.default || adminServiceModule;

export async function GET(_request, { params }) {
  try {
    const { quizId } = await params;
    await requireAdminOrManagerUser();
    const quiz = await adminService.getQuizWithQuestions(quizId);
    return Response.json({ quiz });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { quizId } = await params;
    await requireAdminUser();
    const body = await request.json();
    const quiz = await adminService.updateQuiz(quizId, body);
    return Response.json({ quiz });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { quizId } = await params;
    await requireAdminUser();
    await adminService.deleteQuiz(quizId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}