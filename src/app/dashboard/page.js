import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import DashboardHome from "@/components/dashboard/DashboardHome";
import { authOptions } from "@/lib/auth";
import { connectMongoose } from "@/lib/mongoose";
import Quiz from "../../../server/models/Quiz";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  if (session.user.isBanned) {
    return <p className="rounded-md border border-rose-300 bg-rose-50 p-4 text-rose-800">Your account is blocked.</p>;
  }

  await connectMongoose();
  const now = new Date();
  const hasRunningQuiz = Boolean(
    await Quiz.exists({
      status: "running",
      $or: [{ startsAt: null }, { startsAt: { $lte: now } }],
      $and: [{ $or: [{ endsAt: null }, { endsAt: { $gte: now } }] }],
    })
  );

  return <DashboardHome sessionUser={session.user} hasRunningQuiz={hasRunningQuiz} />;
}
