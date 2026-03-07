import { requireUser, apiErrorResponse } from "@/lib/apiAuth";
import { getJsonCache, setJsonCache } from "@/lib/redis";
import leaderboardServiceModule from "../../../../server/services/leaderboardService";

const leaderboardService = leaderboardServiceModule.default || leaderboardServiceModule;
const LEADERBOARD_CACHE_KEY = "leaderboard:top50";
const LEADERBOARD_CACHE_TTL_SEC = 20;

export async function GET() {
  try {
    const user = await requireUser();
    const participated = await leaderboardService.hasParticipated(user._id);
    if (!participated) {
      return Response.json({ message: "Participate in at least one quiz to unlock leaderboard" }, { status: 403 });
    }

    const cached = await getJsonCache(LEADERBOARD_CACHE_KEY);
    const rows = cached?.rows || (await leaderboardService.getLeaderboardForUser());

    if (!cached) {
      await setJsonCache(LEADERBOARD_CACHE_KEY, { rows }, LEADERBOARD_CACHE_TTL_SEC);
    }

    return Response.json({ rows });
  } catch (error) {
    return apiErrorResponse(error);
  }
}