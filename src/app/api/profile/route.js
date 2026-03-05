import { requireUser, apiErrorResponse } from "@/lib/apiAuth";

const ALLOWED_BRANCHES = [
  "computer science and engineering",
  "mechanical engineering",
  "civil engineering",
  "electrical engineering",
  "electronics and communication engineering",
];

export async function GET() {
  try {
    const user = await requireUser();
    return Response.json({
      profile: {
        id: user._id,
        fullName: user.fullName || user.name || "",
        email: user.email,
        image: user.image || "",
        branch: user.branch || "",
        yearOfStudy: user.yearOfStudy || "",
        studentId: user.studentId || "",
        phoneNumber: user.phoneNumber || "",
        profileCompleted: Boolean(user.profileCompleted),
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const fullName = String(body.fullName || "").trim();
    const branch = String(body.branch || "").trim().toLowerCase();
    const yearOfStudy = Number(body.yearOfStudy);
    const studentId = String(body.studentId || "").trim();
    const phoneNumber = String(body.phoneNumber || "").trim();

    if (!fullName || !branch || !yearOfStudy || !studentId || !phoneNumber) {
      return Response.json({ message: "All profile fields are required" }, { status: 400 });
    }

    if (!ALLOWED_BRANCHES.includes(branch)) {
      return Response.json({ message: "Invalid branch selected" }, { status: 400 });
    }

    if (!Number.isInteger(yearOfStudy) || yearOfStudy < 1 || yearOfStudy > 8) {
      return Response.json({ message: "Year of study must be between 1 and 8" }, { status: 400 });
    }

    user.fullName = fullName;
    user.branch = branch;
    user.yearOfStudy = yearOfStudy;
    user.studentId = studentId;
    user.phoneNumber = phoneNumber;
    user.profileCompleted = true;
    await user.save();

    return Response.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}