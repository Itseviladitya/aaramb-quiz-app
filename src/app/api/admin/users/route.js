import { requireAdminOrManagerUser, requireAdminUser, apiErrorResponse } from "@/lib/apiAuth";
import adminServiceModule from "../../../../../server/services/adminService";

const adminService = adminServiceModule.default || adminServiceModule;

export async function GET() {
  try {
    await requireAdminOrManagerUser();
    const users = await adminService.listUsers();
    return Response.json({ users });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request) {
  try {
    await requireAdminUser();
    const { userId } = await request.json();
    if (!userId) {
      return Response.json({ message: "userId is required" }, { status: 400 });
    }

    await adminService.deleteUser(userId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}