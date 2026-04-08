import { MatchType, SwipeDirection } from "@/generated/prisma";
import { NextResponse } from "next/server";

import { starRepositoryForUser } from "@/lib/github-sync";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

const DAILY_SWIPE_LIMIT = 60;

function normalizePair(a: string, b: string) {
  return a < b ? [a, b] : [b, a];
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    targetType: "user" | "project";
    targetId: string;
    direction: "LEFT" | "RIGHT";
    repositoryFullName?: string;
  };

  if (
    !body.targetId ||
    (body.targetType !== "user" && body.targetType !== "project")
  ) {
    return NextResponse.json(
      { error: "Invalid swipe payload" },
      { status: 400 },
    );
  }

  const profile = await prisma.profileMeta.findUnique({
    where: { userId: session.user.id },
    select: { onboardingComplete: true },
  });

  if (!profile?.onboardingComplete) {
    return NextResponse.json(
      { error: "Complete profile setup before swiping." },
      { status: 400 },
    );
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const swipeCountToday = await prisma.swipe.count({
    where: {
      swiperId: session.user.id,
      createdAt: { gte: startOfDay },
    },
  });

  if (swipeCountToday >= DAILY_SWIPE_LIMIT) {
    return NextResponse.json(
      { error: "Daily swipe limit reached. Come back tomorrow." },
      { status: 429 },
    );
  }

  const direction =
    body.direction === "RIGHT" ? SwipeDirection.RIGHT : SwipeDirection.LEFT;
  const targetUserId = body.targetType === "user" ? body.targetId : null;
  const targetProjectId = body.targetType === "project" ? body.targetId : null;

  await prisma.swipe.upsert({
    where: targetUserId
      ? { swiperId_targetUserId: { swiperId: session.user.id, targetUserId } }
      : {
          swiperId_targetProjectId: {
            swiperId: session.user.id,
            targetProjectId: targetProjectId!,
          },
        },
    update: { direction },
    create: {
      swiperId: session.user.id,
      targetUserId,
      targetProjectId,
      direction,
    },
  });

  let matched = false;
  let matchId: string | null = null;
  let starredRepository = false;

  if (direction === SwipeDirection.RIGHT && targetUserId) {
    const reciprocal = await prisma.swipe.findUnique({
      where: {
        swiperId_targetUserId: {
          swiperId: targetUserId,
          targetUserId: session.user.id,
        },
      },
    });

    if (reciprocal?.direction === SwipeDirection.RIGHT) {
      const [userAId, userBId] = normalizePair(session.user.id, targetUserId);
      const match = await prisma.match.upsert({
        where: {
          type_userAId_userBId: {
            type: MatchType.USER_USER,
            userAId,
            userBId,
          },
        },
        update: {},
        create: {
          type: MatchType.USER_USER,
          status: "ACTIVE",
          userAId,
          userBId,
        },
      });

      matched = true;
      matchId = match.id;
    }
  }

  if (direction === SwipeDirection.RIGHT && targetProjectId) {
    const project = await prisma.project.findUnique({
      where: { id: targetProjectId },
      select: { ownerId: true },
    });

    if (project) {
      const match = await prisma.match.upsert({
        where: {
          type_interestedUserId_projectId: {
            type: MatchType.USER_PROJECT,
            interestedUserId: session.user.id,
            projectId: targetProjectId,
          },
        },
        update: {
          status: "ACTIVE",
        },
        create: {
          type: MatchType.USER_PROJECT,
          status: "ACTIVE",
          interestedUserId: session.user.id,
          projectId: targetProjectId,
          projectOwnerId: project.ownerId,
        },
      });

      matched = true;
      matchId = match.id;
    }

    if (body.repositoryFullName) {
      const starResult = await starRepositoryForUser({
        userId: session.user.id,
        repositoryFullName: body.repositoryFullName,
      });

      starredRepository = starResult.starred;
    }
  }

  return NextResponse.json({
    matched,
    matchId,
    starredRepository,
    remaining: DAILY_SWIPE_LIMIT - (swipeCountToday + 1),
  });
}
