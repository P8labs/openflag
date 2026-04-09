import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { apiError, apiSuccess } from "@/lib/api";
import { starRepositoryForUser } from "@/lib/github-sync";
import { getServerSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return apiError("Unauthorized", 401);
  }

  const body = (await request.json()) as {
    repositoryFullName?: string;
  };

  const repositoryFullName = body.repositoryFullName?.trim();

  if (!repositoryFullName) {
    return apiError("repositoryFullName is required.", 400);
  }

  const result = await starRepositoryForUser({
    userId: session.user.id,
    repositoryFullName,
    useHeaderFallback: await headers(),
  });

  if (!result.starred) {
    const status =
      result.reason === "invalid_repository"
        ? 400
        : result.reason === "missing_access_token"
          ? 401
          : result.reason === "repository_not_found"
            ? 404
            : result.reason === "missing_scope_or_unauthorized"
              ? 403
              : 502;

    return apiError(result.reason, status);
  }

  return apiSuccess({ starred: true });
}
