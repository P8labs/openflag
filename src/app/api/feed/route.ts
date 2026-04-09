import { apiError, apiSuccess } from "@/lib/api";
import { getFeedPage } from "@/lib/feed";
import { getServerSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return apiError("Unauthorized", 401);
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = Number(searchParams.get("limit") ?? "12");

  const page = await getFeedPage({
    userId: session.user.id,
    cursor,
    limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 20) : 12,
  });

  return apiSuccess(page, {
    headers: {
      "Cache-Control": "private, max-age=15, stale-while-revalidate=45",
    },
  });
}
