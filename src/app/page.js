import { getServerSession } from "next-auth";
import Link from "next/link";
import { FiActivity, FiAward, FiBarChart2, FiFileText, FiGithub, FiUsers } from "react-icons/fi";
import { authOptions } from "@/lib/auth";
import { connectMongoose } from "@/lib/mongoose";
import Quiz from "../../server/models/Quiz";
import Attempt from "../../server/models/Attempt";
import LandingActions from "@/components/landing/LandingActions";

async function getLandingData() {
  await connectMongoose();
  const now = new Date();

  const hasRunningQuiz = Boolean(
    await Quiz.exists({
      status: "running",
      $or: [{ startsAt: null }, { startsAt: { $lte: now } }],
      $and: [{ $or: [{ endsAt: null }, { endsAt: { $gte: now } }] }],
    })
  );

  const topAttempts = await Attempt.find({ status: "submitted" })
    .sort({ totalScore: -1, submittedAt: 1 })
    .limit(5)
    .populate("userId", "fullName name email")
    .populate("quizId", "title")
    .lean();

  return { hasRunningQuiz, topAttempts };
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const { hasRunningQuiz, topAttempts } = await getLandingData();

  return (
    <section className="space-y-7">
      <header className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm md:p-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Exclusively for Ramgarh Engineering College students.</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-zinc-900 md:text-5xl">Aarambh Quiz Platform</h1>
        <p className="mt-3 max-w-3xl text-lg font-medium text-zinc-800">Test your knowledge. Compete with your friends. Learn beyond the classroom.</p>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-700">
          A quiz platform built for the students of Ramgarh Engineering College by the Aarambh Club. Participate in coding, tech, robotics and knowledge quizzes organized by the club.
        </p>
        <div className="mt-6">
          <LandingActions sessionUser={session?.user || null} />
        </div>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-zinc-900">About Aarambh Club</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-700">
          Aarambh is the coding and robotics club of Ramgarh Engineering College. The club organizes technical events, coding sessions, robotics activities and quizzes to help students improve their technical skills and problem solving abilities.
        </p>
        <p className="mt-2 text-sm leading-6 text-zinc-700">
          This platform is created to make quiz events more interactive and accessible for students.
        </p>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-zinc-900">Why Aarambh Quiz Platform</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-700">
          Traditional quizzes are limited to classrooms and manual scoring. This platform makes quiz events faster, fair and more engaging.
        </p>
        <p className="mt-2 text-sm leading-6 text-zinc-700">
          Students can participate in quizzes online, track their performance and compete with other students across different branches.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-zinc-900">Platform Features</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <FiActivity /> Interactive Quizzes
            </p>
            <p className="mt-2 text-sm text-zinc-600">Participate in quizzes on coding, robotics, technology and general knowledge.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <FiAward /> Real Time Leaderboard
            </p>
            <p className="mt-2 text-sm text-zinc-600">See how you rank among other students and compete for the top position.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <FiBarChart2 /> Performance Tracking
            </p>
            <p className="mt-2 text-sm text-zinc-600">Track your quiz attempts, scores and progress directly from your profile.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <FiFileText /> Certificate Ready Information
            </p>
            <p className="mt-2 text-sm text-zinc-600">Your name, student ID and details are stored for certificate workflows.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <FiGithub /> GitHub Based Login
            </p>
            <p className="mt-2 text-sm text-zinc-600">Secure login with GitHub for a fast and simple student experience.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <FiUsers /> Student Only Platform
            </p>
            <p className="mt-2 text-sm text-zinc-600">Designed exclusively for Ramgarh Engineering College students.</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-zinc-900">How to Get Started</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-semibold text-zinc-900">Step 1 – Sign Up</p>
            <p className="mt-1 text-sm text-zinc-600">Click Sign Up and fill your student details.</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-semibold text-zinc-900">Step 2 – Login with GitHub</p>
            <p className="mt-1 text-sm text-zinc-600">Authenticate using your GitHub account.</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-semibold text-zinc-900">Step 3 – Start Taking Quizzes</p>
            <p className="mt-1 text-sm text-zinc-600">Join live quizzes organized by Aarambh Club and test your knowledge.</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-zinc-900">Sign Up Modal Information</h2>
        <p className="mt-2 text-sm text-zinc-700">When students click Sign Up, the modal captures the following required information:</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-700">
          <li>Full Name (editable – used for certificates)</li>
          <li>Email (from GitHub – not editable)</li>
          <li>Branch: Computer Science and Engineering, Mechanical Engineering, Civil Engineering, Electrical Engineering, Electronics and Communication Engineering</li>
          <li>Year of Study</li>
          <li>Student ID</li>
          <li>Phone / WhatsApp Number</li>
          <li>Profile Picture (auto fetched from GitHub)</li>
        </ul>
        <p className="mt-3 text-sm font-medium text-zinc-800">Button: Submit</p>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-zinc-900">No Active Quiz</h2>
        {hasRunningQuiz ? (
          <p className="mt-2 text-sm text-emerald-700">A quiz is currently running. Go to dashboard and start your attempt.</p>
        ) : (
          <p className="mt-2 text-sm text-zinc-700">
            No quizzes are currently running. Please check back later for upcoming quizzes and Aarambh Club events.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Top Performers</h2>
            <p className="mt-1 text-sm text-zinc-700">See the top students who are leading the Aarambh Quiz leaderboard.</p>
          </div>
          <Link href="/leaderboard" className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50">
            View Full Leaderboard
          </Link>
        </div>
        {!topAttempts.length ? (
          <p className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
            No quiz attempts have been made yet. Participate in quizzes to appear on the leaderboard.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-600">
                <tr>
                  <th className="px-3 py-2">Rank</th>
                  <th className="px-3 py-2">Student</th>
                  <th className="px-3 py-2">Quiz</th>
                  <th className="px-3 py-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {topAttempts.map((item, index) => (
                  <tr key={String(item._id)} className="border-t border-zinc-100">
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2">{item.userId?.fullName || item.userId?.name || item.userId?.email || "Student"}</td>
                    <td className="px-3 py-2">{item.quizId?.title || "Quiz"}</td>
                    <td className="px-3 py-2 font-semibold">{item.totalScore ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-zinc-900">Your Quiz Dashboard</h2>
        <p className="mt-2 text-sm text-zinc-700">Track your quiz activity in one place.</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-700">
          <li>View quiz history</li>
          <li>Check your scores</li>
          <li>Update your profile details</li>
          <li>Monitor your progress and achievements</li>
        </ul>
        <p className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          You have not attempted any quizzes yet. Start taking quizzes to track your progress here.
        </p>
      </section>

      <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-zinc-900">Industry-Grade UX</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">Live countdown for quiz start</p>
          <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">Quiz timer per question</p>
          <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">Prevent tab switching during quiz</p>
          <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">Leaderboard auto update</p>
          <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">Certificate auto generation</p>
          <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">Mobile friendly UI and dark mode</p>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-zinc-900">Ready to test your knowledge?</h2>
        <p className="mt-2 text-sm text-zinc-700">Join the Aarambh Quiz Platform and start participating in technical quizzes today.</p>
        <div className="mt-5">
          <LandingActions sessionUser={session?.user || null} />
        </div>
      </section>

      <footer className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700 shadow-sm">
        <p className="font-semibold text-zinc-900">Aditya Gupta (Dev Aditya)</p>
        <p>Member of Aarambh Club</p>
        <p>Ramgarh Engineering College</p>
        <p className="mt-2">Built to make quiz events more engaging and accessible for students.</p>
      </footer>
    </section>
  );
}
