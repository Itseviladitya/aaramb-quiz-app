import { requireAdminUser, apiErrorResponse } from "@/lib/apiAuth";
import adminServiceModule from "../../../../../../../server/services/adminService";

const adminService = adminServiceModule.default || adminServiceModule;

export async function PATCH(request, { params }) {
  try {
    const { userId } = await params;
    await requireAdminUser();
    const body = await request.json();
    const role = String(body.role || "").trim().toLowerCase();

    if (!role) {
      return Response.json({ message: "role is required" }, { status: 400 });
    }

    const user = await adminService.setUserRole(userId, role);
    return Response.json({ user });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
