import { requireAdminOrManagerUser, apiErrorResponse } from "@/lib/apiAuth";
import adminServiceModule from "../../../../../server/services/adminService";

const adminService = adminServiceModule.default || adminServiceModule;

export async function GET() {
  try {
    await requireAdminOrManagerUser();
    const rows = await adminService.listResults();
    return Response.json({ rows });
  } catch (error) {
    return apiErrorResponse(error);
  }
}