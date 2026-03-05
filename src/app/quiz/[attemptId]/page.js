import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import QuizSession from "@/components/quiz/QuizSession";
import { authOptions } from "@/lib/auth";

export default async function AttemptPage({ params }) {
  const { attemptId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="relative min-h-screen bg-slate-950 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Ambience */}
      <div className="pointer-events-none fixed inset-0 -z-10 flex overflow-hidden">
        <div className="absolute -top-[40%] left-[20%] h-[1000px] w-[1000px] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute top-[60%] -left-[10%] h-[800px] w-[800px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div
          className="absolute inset-0 z-0 bg-repeat opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <QuizSession attemptId={attemptId} />
      </main>
    </div>
  );
}