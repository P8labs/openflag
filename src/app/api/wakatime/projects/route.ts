import { apiError, apiSuccess } from "@/lib/api";
import { getServerSession } from "@/lib/session";
import { fetchWakatimeProjects, getWakatimeAccessToken } from "@/lib/wakatime";

export async function GET() {
  const session = await getServerSession();

  if (!session) {
    return apiError("Unauthorized", 401);
  }

  const accessToken = await getWakatimeAccessToken(session.user.id);
  if (!accessToken) {
    return apiSuccess({ connected: false, projects: [] });
  }

  try {
    const projects = await fetchWakatimeProjects({ accessToken });
    return apiSuccess({ connected: true, projects });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Unable to fetch WakaTime projects.",
      400,
    );
  }
}
