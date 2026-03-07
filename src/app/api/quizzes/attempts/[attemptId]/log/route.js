import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { logUserActivity } from "../../../../../../../server/services/quizService";
import { requireUser } from "@/lib/apiAuth";
import { rateLimit } from "@/lib/redis";

const LOG_RATE_LIMIT = Number(process.env.QUIZ_LOG_RATE_LIMIT || 25);
const LOG_RATE_WINDOW_SECONDS = Number(process.env.QUIZ_LOG_RATE_WINDOW_SECONDS || 10);

export async function POST(request, { params }) {
    try {
        const user = await requireUser();

        // Await params if Next.js >= 15
        const { attemptId } = await params;
        const body = await request.json();
        const { action, message } = body;

        const limiter = await rateLimit({
            key: `logs:${user._id.toString()}:${attemptId}`,
            limit: LOG_RATE_LIMIT,
            windowSeconds: LOG_RATE_WINDOW_SECONDS,
        });

        if (!limiter.allowed) {
            return NextResponse.json(
                {
                    error: "Too many activity logs in a short time. Please wait and retry.",
                    retryAfterSeconds: limiter.resetInSeconds,
                },
                { status: 429 }
            );
        }

        if (!action || !message) {
            return NextResponse.json({ error: "Action and message required" }, { status: 400 });
        }

        await connectMongoose();

        // Pass the user ID so the service can verify ownership
        await logUserActivity({ attemptId, userId: user._id, action, message });

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("Log Activity API Error:", error);
        return NextResponse.json({ error: error.message || "Failed to log activity" }, { status: error.status || 500 });
    }
}
