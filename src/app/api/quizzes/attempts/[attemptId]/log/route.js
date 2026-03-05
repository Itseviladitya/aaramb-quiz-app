import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { logUserActivity } from "../../../../../../../server/services/quizService";
import { requireUser } from "@/lib/apiAuth";

export async function POST(request, { params }) {
    try {
        const user = await requireUser();

        // Await params if Next.js >= 15
        const { attemptId } = await params;
        const body = await request.json();
        const { action, message } = body;

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
