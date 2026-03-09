import { requireAdminOrManagerUser, apiErrorResponse } from "@/lib/apiAuth";
import Attempt from "../../../../../../../server/models/Attempt";
import adminServiceModule from "../../../../../../../server/services/adminService";

const adminService = adminServiceModule.default || adminServiceModule;
const ALLOWED_STATUSES = new Set(["in_progress", "submitted", "expired", "disqualified"]);

export async function PATCH(request, { params }) {
  try {
    const actor = await requireAdminOrManagerUser();
    const { attemptId } = await params;
    const body = await request.json();

    const nextStatus = String(body?.status || "").trim();
    const nextReason = String(body?.disqualifyReason || "").trim();

    if (!ALLOWED_STATUSES.has(nextStatus)) {
      return Response.json({ message: "Invalid attempt status" }, { status: 400 });
    }

    if (nextStatus === "disqualified" && nextReason.length < 3) {
      return Response.json({ message: "Disqualify reason is required (minimum 3 characters)" }, { status: 400 });
    }

    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      return Response.json({ message: "Attempt not found" }, { status: 404 });
    }

    const previousStatus = attempt.status;
    const previousReason = attempt.disqualifyReason || "";

    attempt.status = nextStatus;

    if (nextStatus === "in_progress") {
      attempt.submittedAt = null;
      attempt.isLocked = false;
      attempt.disqualifyReason = "";
    } else if (nextStatus === "submitted") {
      if (!attempt.submittedAt) {
        attempt.submittedAt = new Date();
      }
      attempt.isLocked = false;
      attempt.disqualifyReason = "";
    } else if (nextStatus === "expired") {
      attempt.isLocked = false;
      attempt.disqualifyReason = "";
    } else if (nextStatus === "disqualified") {
      attempt.isLocked = true;
      attempt.disqualifyReason = nextReason;
    }

    await attempt.save();

    if (actor.role === "manager") {
      await adminService.createAuditLog({
        actorUserId: actor._id,
        actorRole: actor.role,
        action: "ATTEMPT_STATUS_UPDATED",
        targetType: "attempt",
        targetId: attemptId,
        details: {
          previousStatus,
          nextStatus,
          previousReason,
          nextReason: attempt.disqualifyReason || "",
        },
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
