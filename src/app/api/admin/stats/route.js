import { requireAdminOrManagerUser, apiErrorResponse } from "@/lib/apiAuth";
import adminServiceModule from "../../../../../server/services/adminService";

const adminService = adminServiceModule.default || adminServiceModule;

export async function GET() {
  try {
    await requireAdminOrManagerUser();
    const stats = await adminService.getDashboardStats();
    return Response.json(stats);
  } catch (error) {
    return apiErrorResponse(error);
  }
}