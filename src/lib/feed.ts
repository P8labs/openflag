import { prisma } from "@/lib/prisma";

type FeedCursor = {
  type: "user" | "project";
  id: string;
};

export type FeedItem =
  | {
      type: "user";
      id: string;
      score: number;
      userId: string;
      name: string;
      username: string;
      avatar: string | null;
      bio: string | null;
      skills: string[];
      interests: string[];
      recentActivityAt: string;
    }
  | {
      type: "project";
      id: string;
      score: number;
      projectId: string;
      title: string;
      description: string;
      requiredRoles: string[];
      tags: string[];
      owner: {
        id: string;
        name: string;
        username: string;
        avatar: string | null;
      };
      recentActivityAt: string;
    };

export type FeedPage = {
  items: FeedItem[];
  nextCursor: string | null;
};

function encodeCursor(cursor: FeedCursor) {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

function decodeCursor(cursor: string): FeedCursor | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf-8"),
    ) as FeedCursor;
    if (!parsed.id || (parsed.type !== "user" && parsed.type !== "project")) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function scoreOverlap(primary: string[], secondary: string[]) {
  if (primary.length === 0 || secondary.length === 0) {
    return 0;
  }

  const target = new Set(secondary.map((x) => x.toLowerCase()));
  return primary.reduce((acc, current) => {
    if (target.has(current.toLowerCase())) {
      return acc + 1;
    }
    return acc;
  }, 0);
}

function activityBonus(date: Date) {
  const daysAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);

  if (daysAgo <= 1) return 3;
  if (daysAgo <= 7) return 2;
  if (daysAgo <= 21) return 1;
  return 0;
}

export async function getFeedPage({
  userId,
  limit = 12,
  cursor,
}: {
  userId: string;
  limit?: number;
  cursor?: string | null;
}): Promise<FeedPage> {
  const [selfMeta, swipedRows] = await Promise.all([
    prisma.profileMeta.findUnique({ where: { userId } }),
    prisma.swipe.findMany({
      where: { swiperId: userId },
      select: { targetUserId: true, targetProjectId: true },
    }),
  ]);

  const swipedUsers = new Set(
    swipedRows.map((item) => item.targetUserId).filter(Boolean),
  );
  const swipedProjects = new Set(
    swipedRows.map((item) => item.targetProjectId).filter(Boolean),
  );

  const [candidateUsers, candidateProjects] = await Promise.all([
    prisma.profileMeta.findMany({
      where: {
        userId: { not: userId },
        onboardingComplete: true,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { recentActivityAt: "desc" },
      take: 80,
    }),
    prisma.project.findMany({
      where: {
        ownerId: { not: userId },
        isActive: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            profileMeta: {
              select: {
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { recentActivityAt: "desc" },
      take: 80,
    }),
  ]);

  const ownSkills = selfMeta?.skills ?? [];
  const ownInterests = selfMeta?.interests ?? [];

  const userItems: FeedItem[] = candidateUsers
    .filter((candidate) => !swipedUsers.has(candidate.userId))
    .map((candidate) => {
      const skillOverlap = scoreOverlap(ownSkills, candidate.skills);
      const interestOverlap = scoreOverlap(ownInterests, candidate.interests);
      const score =
        skillOverlap * 3 +
        interestOverlap * 2 +
        activityBonus(candidate.recentActivityAt);

      return {
        type: "user",
        id: candidate.userId,
        userId: candidate.userId,
        name: candidate.user.name,
        username: candidate.username,
        avatar: candidate.avatar,
        bio: candidate.bio,
        skills: candidate.skills,
        interests: candidate.interests,
        recentActivityAt: candidate.recentActivityAt.toISOString(),
        score,
      };
    });

  const projectItems: FeedItem[] = candidateProjects
    .filter((project) => !swipedProjects.has(project.id))
    .map((project) => {
      const roleOverlap = scoreOverlap(ownSkills, project.requiredRoles);
      const tagOverlap = scoreOverlap(ownInterests, project.tags);
      const score =
        roleOverlap * 3 +
        tagOverlap * 2 +
        activityBonus(project.recentActivityAt);

      return {
        type: "project",
        id: project.id,
        projectId: project.id,
        title: project.title,
        description: project.description,
        requiredRoles: project.requiredRoles,
        tags: project.tags,
        owner: {
          id: project.owner.id,
          name: project.owner.name,
          username: project.owner.profileMeta?.username ?? "unknown",
          avatar: project.owner.profileMeta?.avatar ?? null,
        },
        recentActivityAt: project.recentActivityAt.toISOString(),
        score,
      };
    });

  const combined = [...userItems, ...projectItems].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    const left = `${a.type}:${a.id}`;
    const right = `${b.type}:${b.id}`;
    return left.localeCompare(right);
  });

  const decoded = cursor ? decodeCursor(cursor) : null;
  const startIndex = decoded
    ? combined.findIndex(
        (item) => item.id === decoded.id && item.type === decoded.type,
      ) + 1
    : 0;

  const items = combined.slice(startIndex, startIndex + limit);
  const lastItem = items.at(-1);

  return {
    items,
    nextCursor:
      startIndex + limit < combined.length && lastItem
        ? encodeCursor({ type: lastItem.type, id: lastItem.id })
        : null,
  };
}
