import { requireAdminOrManagerUser, apiErrorResponse } from "@/lib/apiAuth";
import adminServiceModule from "../../../../../../server/services/adminService";
import mongoose from "mongoose";

const adminService = adminServiceModule.default || adminServiceModule;

export async function GET(request) {
  try {
    await requireAdminOrManagerUser();
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get("quizId");

    if (quizId && !mongoose.Types.ObjectId.isValid(quizId)) {
      return Response.json({ message: "Invalid quizId" }, { status: 400 });
    }

    const rows = await adminService.listResults({ quizId: quizId || undefined });
    const csv = adminService.buildResultsCsv(rows);
    const fileDate = new Date().toISOString().slice(0, 10);
    const fileName = quizId ? `quiz-results-${quizId}-${fileDate}.csv` : `quiz-results-${fileDate}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}