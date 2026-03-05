import { requireAdminOrManagerUser, requireAdminUser, apiErrorResponse } from "@/lib/apiAuth";
import adminServiceModule from "../../../../../server/services/adminService";

const adminService = adminServiceModule.default || adminServiceModule;

export async function GET() {
  try {
    await requireAdminOrManagerUser();
    const quizzes = await adminService.listQuizzesForAdmin();
    return Response.json({ quizzes });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const adminUser = await requireAdminUser();
    const body = await request.json();
    const quiz = await adminService.createQuiz(body, adminUser._id);
    return Response.json({ quiz }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}