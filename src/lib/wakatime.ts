import { auth } from "@/lib/auth";
import { prisma } from "./prisma";

type WakaTimeProjectApiItem = {
  id?: string;
  name?: string;
  human_readable_total?: string;
  total_seconds?: number;
};

type WakaTimeProjectsResponse = {
  data?: WakaTimeProjectApiItem[];
};

export type WakaTimeProject = {
  id: string;
  name: string;
  timeLoggedSeconds: number;
  timeWorkedSeconds: number;
  humanReadableTotal: string | null;
};

function parseSeconds(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value));
}

export async function getWakatimeAccessToken(userId: string) {
  const token = await prisma.account.findFirst({
    where: {
      accountId: `wakatime:${userId}`,
      userId: userId,
    },
  });

  return token?.accessToken ?? null;
}

export async function fetchWakatimeProjects({
  accessToken,
}: {
  accessToken: string;
}) {
  const response = await fetch(
    "https://wakatime.com/api/v1/users/current/projects?sort=-last_heartbeat_at",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Unable to fetch WakaTime projects.");
  }

  const payload = (await response.json()) as WakaTimeProjectsResponse;
  const items = payload.data ?? [];

  return items
    .map((item) => {
      const rawId = item.id?.trim() || item.name?.trim();
      const name = item.name?.trim();
      if (!rawId || !name) {
        return null;
      }

      const seconds = parseSeconds(item.total_seconds);
      return {
        id: rawId,
        name,
        timeLoggedSeconds: seconds,
        timeWorkedSeconds: seconds,
        humanReadableTotal:
          typeof item.human_readable_total === "string"
            ? item.human_readable_total
            : null,
      } satisfies WakaTimeProject;
    })
    .filter((item): item is WakaTimeProject => Boolean(item))
    .slice(0, 100);
}
