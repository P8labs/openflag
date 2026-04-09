import { randomUUID } from "crypto";

import { apiError, apiSuccess } from "@/lib/api";
import { seedProfileFromAuth } from "@/lib/github-sync";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { fetchWakatimeProjects, getWakatimeAccessToken } from "@/lib/wakatime";

export async function GET() {
  const session = await getServerSession();

  if (!session) {
    return apiError("Unauthorized", 401);
  }

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    select: { providerId: true, accessToken: true },
  });

  const githubConnected = accounts.some((item) => item.providerId === "github");
  const wakatimeConnected = accounts.some(
    (item) => item.providerId === "wakatime" && Boolean(item.accessToken),
  );

  let wakatimeProjects: Awaited<ReturnType<typeof fetchWakatimeProjects>> = [];
  if (wakatimeConnected) {
    const token = await getWakatimeAccessToken(session.user.id);
    if (token) {
      try {
        wakatimeProjects = await fetchWakatimeProjects({ accessToken: token });
      } catch {
        wakatimeProjects = [];
      }
    }
  }

  return apiSuccess({ githubConnected, wakatimeConnected, wakatimeProjects });
}

export async function PATCH(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return apiError("Unauthorized", 401);
  }

  const body = (await request.json()) as {
    action?: "sync-github" | "connect-wakatime" | "disconnect-wakatime";
    apiKey?: string;
  };

  if (body.action === "sync-github") {
    const result = await seedProfileFromAuth({ userId: session.user.id });
    if (!result.synced) {
      return apiError(
        "GitHub account not connected. Sign in with GitHub first.",
        400,
      );
    }

    return apiSuccess({ synced: true });
  }

  if (body.action === "connect-wakatime") {
    const apiKey = body.apiKey?.trim();
    if (!apiKey) {
      return apiError("WakaTime API key is required.", 400);
    }

    const existing = await prisma.account.findFirst({
      where: { userId: session.user.id, providerId: "wakatime" },
      select: { id: true },
    });

    if (existing) {
      await prisma.account.update({
        where: { id: existing.id },
        data: {
          accountId: `wakatime:${session.user.id}`,
          accessToken: apiKey,
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.account.create({
        data: {
          id: randomUUID(),
          accountId: `wakatime:${session.user.id}`,
          providerId: "wakatime",
          userId: session.user.id,
          accessToken: apiKey,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    return apiSuccess({ connected: true });
  }

  if (body.action === "disconnect-wakatime") {
    await prisma.account.deleteMany({
      where: { userId: session.user.id, providerId: "wakatime" },
    });

    return apiSuccess({ connected: false });
  }

  return apiError("Invalid action", 400);
}
