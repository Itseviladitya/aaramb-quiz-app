import { requireAdminOrManagerUser, apiErrorResponse } from "@/lib/apiAuth";
import adminServiceModule from "../../../../../server/services/adminService";
import mongoose from "mongoose";

const adminService = adminServiceModule.default || adminServiceModule;

export async function GET(request) {
  try {
    await requireAdminOrManagerUser();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const quizId = searchParams.get("quizId");

    if (quizId && !mongoose.Types.ObjectId.isValid(quizId)) {
      return Response.json({ message: "Invalid quizId" }, { status: 400 });
    }

    const filters = {};
    if (["pending", "approved", "rejected"].includes(status)) {
      filters.status = status;
    }
    if (quizId) {
      filters.quizId = quizId;
    }

    const rows = await adminService.listResubmitRequests(filters);
    return Response.json({ rows });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
