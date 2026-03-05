import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectMongoose } from "@/lib/mongoose";
import User from "../../server/models/User";

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    const error = new Error("Authentication required");
    error.status = 401;
    throw error;
  }

  await connectMongoose();
  const user = await User.findOne({ email: session.user.email });
  if (!user || user.isBanned) {
    const error = new Error("User is banned or missing");
    error.status = 403;
    throw error;
  }

  return user;
}

export async function requireAdminUser() {
  const user = await requireUser();
  if (user.role !== "admin") {
    const error = new Error("Admin access required");
    error.status = 403;
    throw error;
  }
  return user;
}

export async function requireAdminOrManagerUser() {
  const user = await requireUser();
  if (!["admin", "manager"].includes(user.role)) {
    const error = new Error("Admin or manager access required");
    error.status = 403;
    throw error;
  }
  return user;
}

export function apiErrorResponse(error) {
  const status = error.status || 500;
  return Response.json({ message: error.message || "Unexpected server error" }, { status });
}